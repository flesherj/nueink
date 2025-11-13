/**
 * Financial Sync Lambda Handler
 *
 * Scheduled function that syncs financial data from all configured integrations.
 * Fetches IntegrationConfigs, retrieves tokens, executes syncs, and stores results.
 */

import { env } from '$amplify/env/financial-sync';
import {
  NueInkRepositoryFactory,
  CloudWatchMetricsService,
  SecretsManagerService,
} from '@nueink/aws';
import {
  IntegrationConfigService,
  type SyncDateRange,
  type ProviderFactory,
  METRIC_DEFINITIONS,
} from '@nueink/core';
import { YnabProviderFactory } from '@nueink/ynab';
import { PlaidProviderFactory } from '@nueink/plaid';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { initializeAmplifyClient } from '../../../shared/initializeClient';

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

/**
 * Main handler - triggered by EventBridge schedule
 */
export const handler = async (event: any): Promise<void> => {
  console.log('Starting financial sync job', { event });

  try {
    // Fetch all active integration configs
    const configs = await integrationConfigService.listActiveIntegrations();

    console.log(`Found ${configs.length} active integrations to sync`);

    // Process each integration
    const syncPromises = configs.map(async (config) => {
      const startTime = Date.now();
      const { accountId, provider, organizationId } = config;

      try {
        console.log(`Syncing ${provider} for account ${accountId}`);

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

        // TODO: Store synced data in DynamoDB
        // This will be implemented once we have the data models defined
        // For now, the sync providers are just fetching and validating the data
      } catch (error: any) {
        console.error(`Failed to sync ${provider} for account ${accountId}:`, error);

        // Record error metric
        metricsService.record('SYNC_FAILURE', 1, {
          Provider: provider,
          UserId: accountId,
          Status: 'failed',
          ErrorType: error.name || 'unknown',
        });
      }
    });

    // Wait for all syncs to complete
    await Promise.all(syncPromises);

    console.log('Financial sync job completed successfully');
  } catch (error: any) {
    console.error('Financial sync job failed:', error);
    throw error;
  }
};
