import type {
  FinancialAccount,
  Transaction,
  IntegrationStatus,
  FinancialProvider,
} from '../models';
import type {
  FinancialIntegrationFactory,
  CreateIntegrationConfig,
  ProviderCredentials,
} from './FinancialIntegrationFactory';
import type { MetricsService } from './MetricsService';
import type { IntegrationConfigService } from './IntegrationConfigService';
import { STANDARD_DIMENSIONS } from '../config/metrics';

/**
 * Result of syncing financial data
 */
export interface SyncResult {
  success: boolean;
  accountsCount: number;
  transactionsCount: number;
  durationMs: number;
  error?: string;
}

/**
 * FinancialService orchestrates financial data syncing
 *
 * Updated to use IntegrationConfigService for stored configs and token management.
 *
 * Usage:
 * ```typescript
 * const factory = new LambdaFinancialIntegrationFactory();
 * const integrationConfigService = new IntegrationConfigService(repository, secretManager);
 * const service = new FinancialService(factory, integrationConfigService);
 *
 * // Sync using stored integration
 * const result = await service.syncUserData('account-123', 'ynab');
 * console.log(`Synced ${result.accountsCount} accounts, ${result.transactionsCount} transactions`);
 *
 * const accounts = service.getAccounts('org-123');
 * const transactions = service.getTransactions('org-123');
 * ```
 */
export class FinancialService {
  private factory: FinancialIntegrationFactory;
  private integrationConfigService: IntegrationConfigService;
  private metrics?: MetricsService;

  // In-memory storage (replace with repository persistence in production)
  private accounts: Map<string, FinancialAccount[]> = new Map();
  private transactions: Map<string, Transaction[]> = new Map();

  constructor(
    factory: FinancialIntegrationFactory,
    integrationConfigService: IntegrationConfigService,
    metrics?: MetricsService
  ) {
    this.factory = factory;
    this.integrationConfigService = integrationConfigService;
    this.metrics = metrics;
  }

  /**
   * Sync user's financial data from provider
   *
   * Steps:
   * 1. Retrieve stored integration config
   * 2. Retrieve OAuth tokens from Secrets Manager
   * 3. Build runtime integration config with credentials
   * 4. Create integration using factory
   * 5. Check integration status
   * 6. Fetch accounts
   * 7. Fetch transactions (last 30 days)
   * 8. Store in memory (or repositories in production)
   * 9. Update integration config (syncedAt, status)
   * 10. Return sync result
   */
  public syncUserData = async (
    accountId: string,
    provider: FinancialProvider
  ): Promise<SyncResult> => {
    const startTime = Date.now();
    const userId = accountId;

    try {
      // 1. Retrieve stored integration config
      const integrationConfig = await this.integrationConfigService.findByAccountIdAndProvider(
        accountId,
        provider
      );

      if (!integrationConfig) {
        const durationMs = Date.now() - startTime;
        this.metrics?.record('SYNC_FAILURE', 1, {
          UserId: userId,
          Provider: provider,
          Status: STANDARD_DIMENSIONS.STATUS.FAILURE,
          ErrorType: 'ConfigNotFound',
        });
        return {
          success: false,
          accountsCount: 0,
          transactionsCount: 0,
          durationMs,
          error: `No integration config found for ${accountId}/${provider}`,
        };
      }

      // Check if integration is active
      if (integrationConfig.status !== 'active') {
        const durationMs = Date.now() - startTime;
        this.metrics?.record('SYNC_FAILURE', 1, {
          UserId: userId,
          Provider: provider,
          Status: STANDARD_DIMENSIONS.STATUS.FAILURE,
          ErrorType: 'IntegrationDisabled',
        });
        return {
          success: false,
          accountsCount: 0,
          transactionsCount: 0,
          durationMs,
          error: `Integration is ${integrationConfig.status}`,
        };
      }

      // 2. Retrieve OAuth tokens
      const tokens = await this.integrationConfigService.getTokens(accountId, provider);
      if (!tokens) {
        const durationMs = Date.now() - startTime;
        this.metrics?.record('SYNC_FAILURE', 1, {
          UserId: userId,
          Provider: provider,
          Status: STANDARD_DIMENSIONS.STATUS.FAILURE,
          ErrorType: 'TokensNotFound',
        });
        return {
          success: false,
          accountsCount: 0,
          transactionsCount: 0,
          durationMs,
          error: `No tokens found for ${accountId}/${provider}`,
        };
      }

      // 3. Build runtime integration config with credentials
      const credentials = this.buildCredentials(provider, tokens.accessToken);
      const runtimeConfig: CreateIntegrationConfig = {
        provider,
        organizationId: integrationConfig.organizationId,
        profileOwner: integrationConfig.profileOwner,
        credentials,
      };

      // 4. Create integration
      const integration = this.factory.create(runtimeConfig);

      // 5. Check status
      const status = await integration.getStatus();
      if (!status.connected) {
        const durationMs = Date.now() - startTime;

        // Update integration config with error
        await this.integrationConfigService.update(integrationConfig.integrationId, {
          status: 'error',
          lastSyncError: status.error || 'Integration not connected',
        });

        // Record failure metric
        this.metrics?.record('SYNC_FAILURE', 1, {
          UserId: userId,
          Provider: provider,
          Status: STANDARD_DIMENSIONS.STATUS.FAILURE,
          ErrorType: 'NotConnected',
        });

        this.metrics?.record('SYNC_DURATION', durationMs, {
          UserId: userId,
          Provider: provider,
        });

        return {
          success: false,
          accountsCount: 0,
          transactionsCount: 0,
          durationMs,
          error: status.error || 'Integration not connected',
        };
      }

      // 6. Fetch accounts
      const accounts = await integration.getAccounts();

      // 7. Fetch transactions (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const transactions = await integration.getTransactions(
        startDate.toISOString().split('T')[0], // YYYY-MM-DD
        endDate.toISOString().split('T')[0]
      );

      // 8. Store in memory (TODO: persist to repositories)
      this.accounts.set(integrationConfig.organizationId, accounts);
      this.transactions.set(integrationConfig.organizationId, transactions);

      const durationMs = Date.now() - startTime;

      // 9. Update integration config with successful sync
      await this.integrationConfigService.update(integrationConfig.integrationId, {
        syncedAt: new Date(),
        status: 'active',
        lastSyncError: undefined, // Clear any previous errors
      });

      // Record success metrics
      this.metrics?.record('SYNC_SUCCESS', 1, {
        UserId: userId,
        Provider: provider,
        Status: STANDARD_DIMENSIONS.STATUS.SUCCESS,
      });

      this.metrics?.record('SYNC_DURATION', durationMs, {
        UserId: userId,
        Provider: provider,
      });

      this.metrics?.record('ACCOUNTS_SYNCED', accounts.length, {
        UserId: userId,
        Provider: provider,
      });

      this.metrics?.record('TRANSACTIONS_SYNCED', transactions.length, {
        UserId: userId,
        Provider: provider,
      });

      return {
        success: true,
        accountsCount: accounts.length,
        transactionsCount: transactions.length,
        durationMs,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Record failure metrics
      this.metrics?.record('SYNC_FAILURE', 1, {
        UserId: userId,
        Provider: provider,
        Status: STANDARD_DIMENSIONS.STATUS.FAILURE,
        ErrorType: this.categorizeError(errorMessage),
      }, {
        error: errorMessage,
      });

      this.metrics?.record('SYNC_DURATION', durationMs, {
        UserId: userId,
        Provider: provider,
      });

      return {
        success: false,
        accountsCount: 0,
        transactionsCount: 0,
        durationMs,
        error: errorMessage,
      };
    }
  };

  /**
   * Build provider-specific credentials from access token
   */
  private buildCredentials = (
    provider: FinancialProvider,
    accessToken: string
  ): ProviderCredentials => {
    switch (provider) {
      case 'ynab':
        return { type: 'ynab', accessToken };
      case 'plaid':
        return { type: 'plaid', accessToken };
      case 'manual':
        return { type: 'manual' };
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  };

  /**
   * Categorize error for metrics
   */
  private categorizeError = (error: string): string => {
    const errorLower = error.toLowerCase();

    if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
      return 'Timeout';
    }
    if (errorLower.includes('unauthorized') || errorLower.includes('401')) {
      return 'Unauthorized';
    }
    if (errorLower.includes('forbidden') || errorLower.includes('403')) {
      return 'Forbidden';
    }
    if (errorLower.includes('not found') || errorLower.includes('404')) {
      return 'NotFound';
    }
    if (errorLower.includes('rate limit') || errorLower.includes('429')) {
      return 'RateLimit';
    }
    if (errorLower.includes('network') || errorLower.includes('connection')) {
      return 'Network';
    }

    return 'Unknown';
  };

  /**
   * Get cached accounts for organization
   */
  public getAccounts = (organizationId: string): FinancialAccount[] => {
    return this.accounts.get(organizationId) || [];
  };

  /**
   * Get cached transactions for organization
   */
  public getTransactions = (organizationId: string): Transaction[] => {
    return this.transactions.get(organizationId) || [];
  };

  /**
   * Get integration status
   */
  public getIntegrationStatus = async (
    accountId: string,
    provider: FinancialProvider
  ): Promise<IntegrationStatus> => {
    try {
      // Retrieve stored integration config
      const integrationConfig = await this.integrationConfigService.findByAccountIdAndProvider(
        accountId,
        provider
      );

      if (!integrationConfig) {
        return {
          connected: false,
          error: `No integration config found for ${accountId}/${provider}`,
        };
      }

      // Retrieve OAuth tokens
      const tokens = await this.integrationConfigService.getTokens(accountId, provider);
      if (!tokens) {
        return {
          connected: false,
          error: `No tokens found for ${accountId}/${provider}`,
        };
      }

      // Build runtime config and check status
      const credentials = this.buildCredentials(provider, tokens.accessToken);
      const runtimeConfig: CreateIntegrationConfig = {
        provider,
        organizationId: integrationConfig.organizationId,
        profileOwner: integrationConfig.profileOwner,
        credentials,
      };

      const integration = this.factory.create(runtimeConfig);
      return await integration.getStatus();
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  /**
   * Refresh account balances
   */
  public refreshBalances = async (
    accountId: string,
    provider: FinancialProvider
  ): Promise<FinancialAccount[]> => {
    const startTime = Date.now();
    const userId = accountId;

    try {
      // Retrieve stored integration config
      const integrationConfig = await this.integrationConfigService.findByAccountIdAndProvider(
        accountId,
        provider
      );

      if (!integrationConfig) {
        throw new Error(`No integration config found for ${accountId}/${provider}`);
      }

      // Retrieve OAuth tokens
      const tokens = await this.integrationConfigService.getTokens(accountId, provider);
      if (!tokens) {
        throw new Error(`No tokens found for ${accountId}/${provider}`);
      }

      // Build runtime config
      const credentials = this.buildCredentials(provider, tokens.accessToken);
      const runtimeConfig: CreateIntegrationConfig = {
        provider,
        organizationId: integrationConfig.organizationId,
        profileOwner: integrationConfig.profileOwner,
        credentials,
      };

      const integration = this.factory.create(runtimeConfig);
      const accounts = await integration.refreshBalances();

      // Update cached accounts
      this.accounts.set(integrationConfig.organizationId, accounts);

      const durationMs = Date.now() - startTime;

      // Record success metrics
      this.metrics?.record('BALANCE_REFRESH_SUCCESS', 1, {
        UserId: userId,
        Provider: provider,
        Status: STANDARD_DIMENSIONS.STATUS.SUCCESS,
      });

      this.metrics?.record('BALANCE_REFRESH_DURATION', durationMs, {
        UserId: userId,
        Provider: provider,
      });

      this.metrics?.record('ACCOUNTS_REFRESHED', accounts.length, {
        UserId: userId,
        Provider: provider,
      });

      return accounts;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Record failure metrics
      this.metrics?.record('BALANCE_REFRESH_FAILURE', 1, {
        UserId: userId,
        Provider: provider,
        Status: STANDARD_DIMENSIONS.STATUS.FAILURE,
        ErrorType: this.categorizeError(errorMessage),
      }, {
        error: errorMessage,
      });

      this.metrics?.record('BALANCE_REFRESH_DURATION', durationMs, {
        UserId: userId,
        Provider: provider,
      });

      throw error; // Re-throw to let caller handle
    }
  };

  /**
   * Clear cached data for organization
   */
  public clearCache = (organizationId: string): void => {
    this.accounts.delete(organizationId);
    this.transactions.delete(organizationId);
  };
}
