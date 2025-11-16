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

import {env} from '$amplify/env/financial-sync';
import {Environment} from './Environment';
import {NueInkRepositoryFactory} from '@nueink/aws';
import {AwsServiceFactory} from '@nueink/aws/services';
import {
    type SyncDateRange,
    type ProviderFactory,
    type FinancialProvider,
    type FinancialAccount,
    type Transaction,
    type EventBridgeEvent,
    extractDetail,
    NueInkServiceFactory,
} from '@nueink/core';
import {YnabProviderFactory} from '@nueink/ynab';
import {PlaidProviderFactory} from '@nueink/plaid';
import {Configuration, PlaidApi, PlaidEnvironments} from 'plaid';
import {initializeAmplifyClient} from '../../../shared/initializeClient';

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

// Initialize factories
const repositoryFactory = NueInkRepositoryFactory.getInstance(client);
const serviceFactory = NueInkServiceFactory.getInstance(repositoryFactory);
const awsFactory = AwsServiceFactory.getInstance();

// Domain services (from NueInkServiceFactory)
const financialAccountService = serviceFactory.financialAccount();
const transactionService = serviceFactory.transaction();
const integrationService = serviceFactory.integration(awsFactory.secretsManager());

// AWS infrastructure services (from AwsServiceFactory)
const metricsService = awsFactory.metrics();

// Create PlaidApi client with app credentials (reused for all Plaid integrations)
const plaidEnvironmentMap: Record<string, any> = {
    sandbox: PlaidEnvironments.sandbox,
    development: PlaidEnvironments.development,
    production: PlaidEnvironments.production,
};
const plaidEnvironment =
    plaidEnvironmentMap[Environment.plaidEnvironment] || PlaidEnvironments.sandbox;

const plaidConfiguration = new Configuration({
    basePath: plaidEnvironment,
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': Environment.plaidClientId,
            'PLAID-SECRET': Environment.plaidSecret,
        },
    },
});

const plaidClient = new PlaidApi(plaidConfiguration);

// Register provider factories
const providerFactories: Record<string, ProviderFactory> = {
    ynab: new YnabProviderFactory(Environment.ynabOAuthConfig()),
    plaid: new PlaidProviderFactory(plaidClient),
};

// ========== Helper Functions ==========

/**
 * Store accounts with deduplication logic
 * Prevents duplicate account records when multiple users in same org sync the same accounts
 */
const storeAccountsWithDeduplication = async (
    accounts: Array<FinancialAccount>,
    organizationId: string,
    provider: FinancialProvider
): Promise<{ created: number; skipped: number; updated: number }> => {
    let created = 0;
    let skipped = 0;
    let updated = 0;

    for (const account of accounts) {
        try {
            // Skip if no external ID (can't deduplicate without it)
            if (!account.externalAccountId) {
                console.warn(`Account ${account.name} has no externalAccountId, skipping deduplication`);
                await financialAccountService.create(account);
                created++;
                continue;
            }

            // Check if account already exists in this organization
            const orgAccounts = await financialAccountService.findByOrganization(organizationId, 1000);
            const existingAccount = orgAccounts.items.find(
                (existing) =>
                    existing.provider === provider &&
                    existing.externalAccountId === account.externalAccountId
            );

            if (existingAccount) {
                // Account already exists - update balances, status, and raw data
                console.log(
                    `Account ${account.name} (${account.externalAccountId}) already exists in org ${organizationId}, updating`
                );

                // Log what we're about to update
                const updatePayload = {
                    currentBalance: account.currentBalance,
                    availableBalance: account.availableBalance,
                    status: account.status,
                    rawData: account.rawData,
                    syncedAt: account.syncedAt,
                };
                console.log('[DEBUG] Update payload before service call:', JSON.stringify({
                    accountId: existingAccount.financialAccountId,
                    accountName: account.name,
                    payload: updatePayload,
                }, null, 2));

                await financialAccountService.update(existingAccount.financialAccountId, updatePayload);
                updated++;
            } else {
                // New account - create it
                await financialAccountService.create(account);
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

    return {created, skipped, updated};
};

/**
 * Store transactions with deduplication logic
 * Prevents duplicate transaction records when syncing the same transactions
 */
const storeTransactionsWithDeduplication = async (
    transactions: Array<Transaction>,
    organizationId: string,
    provider: FinancialProvider
): Promise<{ created: number; skipped: number; updated: number }> => {
    let created = 0;
    let skipped = 0;
    let updated = 0;

    for (const transaction of transactions) {
        try {
            // Skip if no external ID (can't deduplicate without it)
            if (!transaction.externalTransactionId) {
                console.warn(`Transaction ${transaction.name} has no externalTransactionId, skipping deduplication`);
                await transactionService.create(transaction);
                created++;
                continue;
            }

            // Check if transaction already exists in this organization
            const orgTransactions = await transactionService.findByOrganization(organizationId, 1000);
            const existingTransaction = orgTransactions.items.find(
                (existing) =>
                    existing.provider === provider &&
                    existing.externalTransactionId === transaction.externalTransactionId
            );

            if (existingTransaction) {
                // Transaction already exists - update if needed (pending status, amounts can change)
                console.log(
                    `Transaction ${transaction.name} (${transaction.externalTransactionId}) already exists, updating`
                );

                await transactionService.update(existingTransaction.transactionId, {
                    amount: transaction.amount,
                    pending: transaction.pending,
                    rawData: transaction.rawData, // Update raw provider data on each sync
                    syncedAt: transaction.syncedAt,
                    // updatedAt is automatically set by service
                });
                updated++;
            } else {
                // New transaction - create it
                await transactionService.create(transaction);
                console.log(
                    `Created new transaction ${transaction.name} (${transaction.externalTransactionId}) for org ${organizationId}`
                );
                created++;
            }
        } catch (error: any) {
            console.error(`Failed to store transaction ${transaction.name}:`, error);
            // Continue with other transactions even if one fails
        }
    }

    return {created, skipped, updated};
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
        const config = await integrationService.findByAccountIdAndProvider(
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
        let tokens = await integrationService.getTokens(accountId, provider);

        if (!tokens?.accessToken) {
            throw new Error(`No access token found for ${provider} integration`);
        }

        // Check if token needs refresh
        if (await integrationService.needsTokenRefresh(accountId, provider)) {
            console.log(`Token expired for ${provider}, attempting refresh`);

            if (!(await integrationService.hasRefreshToken(accountId, provider))) {
                throw new Error(`Token expired and no refresh token available for ${provider}`);
            }

            // Get the factory and create OAuth provider for refresh
            const factory = providerFactories[provider];
            if (!factory) {
                throw new Error(`Unsupported provider: ${provider}`);
            }

            try {
                // Create OAuth provider and refresh the token
                const oauthProvider = factory.createOAuthProvider();

                // Check if provider supports token refresh
                if (!oauthProvider.refreshAccessToken) {
                    throw new Error(`${provider} does not support token refresh`);
                }

                if (!tokens.refreshToken) {
                    throw new Error(`No refresh token available for ${provider}`);
                }

                console.log(`Refreshing ${provider} access token using refresh token`);
                const newTokens = await oauthProvider.refreshAccessToken(tokens.refreshToken);

                // Update tokens in Secrets Manager
                await integrationService.updateTokens(accountId, provider, newTokens);
                console.log(`Successfully refreshed ${provider} access token`);

                // Update tokens variable to use fresh token for sync
                tokens = await integrationService.getTokens(accountId, provider);
                if (!tokens?.accessToken) {
                    throw new Error(`Failed to retrieve refreshed tokens for ${provider}`);
                }
            } catch (error: any) {
                console.error(`Token refresh failed for ${provider}:`, error);
                throw new Error(`Token refresh failed: ${error.message}`);
            }
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
            await integrationService.updateLastSyncTime(accountId, provider);
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
            await integrationService.updateLastSyncTime(accountId, provider);

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

        // Store transactions in DynamoDB with deduplication
        if (transactionsResult.success && transactionsResult.data.length > 0) {
            const transactionStorageResult = await storeTransactionsWithDeduplication(
                transactionsResult.data,
                organizationId,
                provider
            );

            console.log(`Transaction storage: ${transactionStorageResult.created} created, ${transactionStorageResult.updated} updated, ${transactionStorageResult.skipped} skipped`);

            // Record transaction storage metrics
            metricsService.record('TRANSACTIONS_SYNCED', transactionsResult.data.length, {
                Provider: provider,
                UserId: accountId,
            });
        }
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
    console.log('Starting financial sync', {event});

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
            const configs = await integrationService.listActiveIntegrations();
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
