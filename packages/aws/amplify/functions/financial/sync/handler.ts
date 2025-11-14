/**
 * Financial Sync Lambda Handler
 *
 * Flexible sync function supporting multiple invocation patterns:
 * 1. Scheduled sync (all active integrations)
 * 2. Single user sync (API-triggered)
 * 3. Bulk sync (array of users)
 *
 * Event structure:
 * - Sync all (scheduled): {} or no event
 * - Sync specific: { integrations: [{ accountId, provider }, ...] }
 * - Sync single: { integrations: [{ accountId: 'user-123', provider: 'ynab' }] }
 */

import { env } from '$amplify/env/financial-sync';
import { NueInkRepositoryFactory } from '@nueink/aws';
import { CloudWatchMetricsService, SecretsManagerService } from '@nueink/aws/services';
import {
  IntegrationConfigService,
  type SyncDateRange,
  type ProviderFactory,
  type FinancialProvider,
  type EventBridgeEvent,
  extractDetail,
} from '@nueink/core';
import { YnabProviderFactory } from '@nueink/ynab';
import { PlaidProviderFactory } from '@nueink/plaid';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { initializeAmplifyClient } from '../../../shared/initializeClient';

// ========== Event Types ==========

interface SyncTarget {
  accountId: string;
  provider: FinancialProvider;
}

interface FinancialSyncEvent {
  // If present, sync these specific integrations (single or bulk)
  // If absent, sync all active integrations (scheduled behavior)
  integrations?: SyncTarget[];
}

// ========== Service Initialization ==========

// Initialize Amplify client
const client = await initializeAmplifyClient(env);

// Initialize services
const factory = NueInkRepositoryFactory.getInstance(client);
const integrationConfigRepository = factory.repository('integrationConfig');
const secretManager = new SecretsManagerService();
const integrationConfigService = new IntegrationConfigService(
  integrationConfigRepository,
  secretManager
);
const metricsService = new CloudWatchMetricsService();

// Create PlaidApi client with app credentials (reused for all Plaid integrations)
const plaidEnvironmentMap: Record<string, any> = {
  sandbox: PlaidEnvironments.sandbox,
  development: PlaidEnvironments.development,
  production: PlaidEnvironments.production,
};
const plaidEnvironment =
  plaidEnvironmentMap[env.PLAID_ENVIRONMENT] || PlaidEnvironments.sandbox;

const plaidConfiguration = new Configuration({
  basePath: plaidEnvironment,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': env.PLAID_CLIENT_ID,
      'PLAID-SECRET': env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(plaidConfiguration);

// Register provider factories
const providerFactories: Record<string, ProviderFactory> = {
  ynab: new YnabProviderFactory(),
  plaid: new PlaidProviderFactory(plaidClient),
};

// ========== Helper Functions ==========

/**
 * Store accounts with deduplication logic
 * Prevents duplicate account records when multiple users in same org sync the same accounts
 */
const storeAccountsWithDeduplication = async (
  accounts: any[],
  organizationId: string,
  provider: FinancialProvider
): Promise<{ created: number; skipped: number; updated: number }> => {
  const financialAccountRepo = factory.repository('financialAccount');
  let created = 0;
  let skipped = 0;
  let updated = 0;

  for (const account of accounts) {
    try {
      // Skip if no external ID (can't deduplicate without it)
      if (!account.externalAccountId) {
        console.warn(`Account ${account.name} has no externalAccountId, skipping deduplication`);
        await financialAccountRepo.save(account);
        created++;
        continue;
      }

      // Check if account already exists in this organization
      const orgAccounts = await financialAccountRepo.findByOrganization(organizationId, 1000);
      const existingAccount = orgAccounts.items.find(
        (existing: any) =>
          existing.provider === provider &&
          existing.externalAccountId === account.externalAccountId
      );

      if (existingAccount) {
        // Account already exists - update balances and sync timestamp
        console.log(
          `Account ${account.name} (${account.externalAccountId}) already exists in org ${organizationId}, updating`
        );

        await financialAccountRepo.update(existingAccount.financialAccountId, {
          currentBalance: account.currentBalance,
          availableBalance: account.availableBalance,
          status: account.status,
          syncedAt: account.syncedAt,
          updatedAt: new Date().toISOString(),
        });
        updated++;
      } else {
        // New account - create it
        await financialAccountRepo.save(account);
        console.log(
          `Created new account ${account.name} (${account.externalAccountId}) for org ${organizationId}`
        );
        created++;
      }
    } catch (error: any) {
      console.error(`Failed to store account ${account.name}:`, error);
      // Continue with other accounts even if one fails
    }
  }

  return { created, skipped, updated };
};

// ========== Core Sync Logic ==========

/**
 * Sync a single integration (extracted for reuse)
 */
const syncIntegration = async (
  accountId: string,
  provider: FinancialProvider
): Promise<void> => {
  const startTime = Date.now();

  try {
    console.log(`Syncing ${provider} for account ${accountId}`);

    // Get integration config
    const config = await integrationConfigService.findByAccountIdAndProvider(
      accountId,
      provider
    );

    if (!config) {
      throw new Error(`No integration config found for ${accountId}/${provider}`);
    }

    if (config.status !== 'active') {
      console.warn(`Integration ${accountId}/${provider} is ${config.status}, skipping`);
      return;
    }

    const organizationId = config.organizationId;

    // Get access token from Secrets Manager
    const tokens = await integrationConfigService.getTokens(accountId, provider);

    if (!tokens?.accessToken) {
      throw new Error(`No access token found for ${provider} integration`);
    }

    // Check if token needs refresh
    if (await integrationConfigService.needsTokenRefresh(accountId, provider)) {
      console.log(`Token expired for ${provider}, attempting refresh`);

      if (!(await integrationConfigService.hasRefreshToken(accountId, provider))) {
        throw new Error(`Token expired and no refresh token available for ${provider}`);
      }

      // Token refresh should have been handled by a separate process
      // For now, log and skip this integration
      console.warn(`Token refresh needed but not implemented yet for ${provider}`);
      return;
    }

    // Define date range for transaction sync (last 30 days)
    const dateRange: SyncDateRange = {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(),
    };

    // Get factory for this provider
    const factory = providerFactories[provider];
    if (!factory) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    // Create sync provider using factory
    const syncProvider = factory.createSyncProvider(tokens, organizationId, accountId);

    // Execute syncs in parallel
    const [accountsResult, transactionsResult, balancesResult] = await Promise.all([
      syncProvider.syncAccounts(),
      syncProvider.syncTransactions(dateRange),
      syncProvider.syncBalances(),
    ]);

    // Log results
    console.log(`Sync completed for ${provider}`, {
      accounts: accountsResult.metadata,
      transactions: transactionsResult.metadata,
      balances: balancesResult.metadata,
    });

    // Check for errors
    const errors = [accountsResult, transactionsResult, balancesResult]
      .filter((result) => !result.success)
      .map((result) => result.error);

    if (errors.length > 0) {
      console.error(`Sync errors for ${provider}:`, errors);

      // Record error metric
      metricsService.record('SYNC_FAILURE', 1, {
        Provider: provider,
        UserId: accountId,
        Status: 'partial_failure',
        ErrorType: 'sync_error',
      });

      // Update last sync time even if partial failure
      await integrationConfigService.updateLastSyncTime(accountId, provider);
    } else {
      // Record success metrics
      const duration = Date.now() - startTime;
      metricsService.record('SYNC_DURATION', duration, {
        Provider: provider,
        UserId: accountId,
      });

      metricsService.record('SYNC_SUCCESS', 1, {
        Provider: provider,
        UserId: accountId,
        Status: 'success',
      });

      // Update last sync time
      await integrationConfigService.updateLastSyncTime(accountId, provider);

      console.log(`Successfully synced ${provider} for account ${accountId} in ${duration}ms`);
    }

    // Store synced data in DynamoDB with deduplication
    if (accountsResult.success && accountsResult.data.length > 0) {
      const storageResult = await storeAccountsWithDeduplication(
        accountsResult.data,
        organizationId,
        provider
      );

      console.log(`Account storage: ${storageResult.created} created, ${storageResult.updated} updated, ${storageResult.skipped} skipped`);

      // Record account storage metrics
      metricsService.record('ACCOUNTS_SYNCED', accountsResult.data.length, {
        Provider: provider,
        UserId: accountId,
      });
    }

    // TODO: Store transactions in DynamoDB
    // Transaction storage will be similar but needs transaction deduplication by externalTransactionId
  } catch (error: any) {
    console.error(`Failed to sync ${provider} for account ${accountId}:`, error);

    // Record error metric
    metricsService.record('SYNC_FAILURE', 1, {
      Provider: provider,
      UserId: accountId,
      Status: 'failed',
      ErrorType: error.name || 'unknown',
    });

    // Re-throw to allow caller to handle
    throw error;
  }
};

// ========== Main Handler ==========

/**
 * Main handler with flexible invocation support
 * Handles both direct invocations and EventBridge events
 */
export const handler = async (
  event: FinancialSyncEvent | EventBridgeEvent<FinancialSyncEvent>
): Promise<void> => {
  console.log('Starting financial sync', { event });

  try {
    // Extract detail from EventBridge event or use direct invocation payload
    const syncEvent = extractDetail(event);

    let targets: SyncTarget[] = [];

    if (syncEvent.integrations) {
      // Specific integrations provided (single or bulk)
      targets = syncEvent.integrations;
      console.log(`Syncing ${targets.length} specific integration(s)`);
    } else {
      // No integrations specified: sync all active integrations (scheduled behavior)
      console.log('Scheduled sync: fetching all active integrations');
      const configs = await integrationConfigService.listActiveIntegrations();
      targets = configs.map((config) => ({
        accountId: config.accountId,
        provider: config.provider,
      }));
      console.log(`Found ${targets.length} active integrations to sync`);
    }

    // Execute syncs in parallel
    // TODO: Scale Limit - Current implementation processes all targets concurrently.
    // This works well for < 500 users but will need refactoring at scale:
    // - 500-1K users: Add concurrency control (p-limit with max 20-50 concurrent)
    // - 1K+ users: Implement batching with pagination
    // - 10K+ users: Fan-out architecture (publish to EventBridge/SQS, separate consumer Lambda)
    const syncPromises = targets.map((target) =>
      syncIntegration(target.accountId, target.provider).catch((error) => {
        // Catch individual sync errors to prevent one failure from stopping all syncs
        console.error(`Sync failed for ${target.accountId}/${target.provider}:`, error);
      })
    );

    await Promise.all(syncPromises);

    console.log('Financial sync completed successfully');
  } catch (error: any) {
    console.error('Financial sync failed:', error);
    throw error;
  }
};
