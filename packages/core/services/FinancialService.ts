import type {
  FinancialAccount,
  Transaction,
  IntegrationStatus,
} from '../models';
import type {
  FinancialIntegrationFactory,
  IntegrationConfig,
} from './FinancialIntegrationFactory';
import type { MetricsService } from './MetricsService';
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
 * This is a simple in-memory implementation for testing.
 * Production implementation will persist to DynamoDB.
 *
 * Usage:
 * ```typescript
 * const factory = new LambdaFinancialIntegrationFactory();
 * const service = new FinancialService(factory);
 *
 * const config: IntegrationConfig = {
 *   provider: 'ynab',
 *   organizationId: 'org-123',
 *   profileOwner: 'user-123',
 *   credentials: {
 *     type: 'ynab',
 *     accessToken: 'token-xyz',
 *   },
 * };
 *
 * const result = await service.syncUserData(config);
 * console.log(`Synced ${result.accountsCount} accounts, ${result.transactionsCount} transactions`);
 *
 * const accounts = service.getAccounts('org-123');
 * const transactions = service.getTransactions('org-123');
 * ```
 */
export class FinancialService {
  private factory: FinancialIntegrationFactory;
  private metrics?: MetricsService;

  // In-memory storage (replace with DynamoDB in production)
  private accounts: Map<string, FinancialAccount[]> = new Map();
  private transactions: Map<string, Transaction[]> = new Map();

  constructor(factory: FinancialIntegrationFactory, metrics?: MetricsService) {
    this.factory = factory;
    this.metrics = metrics;
  }

  /**
   * Sync user's financial data from provider
   *
   * Steps:
   * 1. Create integration using factory
   * 2. Check integration status
   * 3. Fetch accounts
   * 4. Fetch transactions (last 30 days)
   * 5. Store in memory (or DynamoDB in production)
   * 6. Return sync result
   */
  public syncUserData = async (
    config: IntegrationConfig
  ): Promise<SyncResult> => {
    const startTime = Date.now();
    const userId = config.profileOwner;
    const provider = config.provider;

    try {
      // Create integration
      const integration = this.factory.create(config);

      // Check status
      const status = await integration.getStatus();
      if (!status.connected) {
        const durationMs = Date.now() - startTime;

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

      // Fetch accounts
      const accounts = await integration.getAccounts();

      // Fetch transactions (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const transactions = await integration.getTransactions(
        startDate.toISOString().split('T')[0], // YYYY-MM-DD
        endDate.toISOString().split('T')[0]
      );

      // Store in memory
      this.accounts.set(config.organizationId, accounts);
      this.transactions.set(config.organizationId, transactions);

      const durationMs = Date.now() - startTime;

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
   * Categorize error for metrics
   */
  private categorizeError(error: string): string {
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
  }

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
    config: IntegrationConfig
  ): Promise<IntegrationStatus> => {
    try {
      const integration = this.factory.create(config);
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
    config: IntegrationConfig
  ): Promise<FinancialAccount[]> => {
    const integration = this.factory.create(config);
    const accounts = await integration.refreshBalances();

    // Update cached accounts
    this.accounts.set(config.organizationId, accounts);

    return accounts;
  };

  /**
   * Clear cached data for organization
   */
  public clearCache = (organizationId: string): void => {
    this.accounts.delete(organizationId);
    this.transactions.delete(organizationId);
  };
}
