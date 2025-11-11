import type {
  FinancialAccount,
  Transaction,
  IntegrationStatus,
} from '../models';
import type {
  FinancialIntegrationFactory,
  IntegrationConfig,
} from './FinancialIntegrationFactory';

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

  // In-memory storage (replace with DynamoDB in production)
  private accounts: Map<string, FinancialAccount[]> = new Map();
  private transactions: Map<string, Transaction[]> = new Map();

  constructor(factory: FinancialIntegrationFactory) {
    this.factory = factory;
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

    try {
      // Create integration
      const integration = this.factory.create(config);

      // Check status
      const status = await integration.getStatus();
      if (!status.connected) {
        return {
          success: false,
          accountsCount: 0,
          transactionsCount: 0,
          durationMs: Date.now() - startTime,
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

      return {
        success: true,
        accountsCount: accounts.length,
        transactionsCount: transactions.length,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        accountsCount: 0,
        transactionsCount: 0,
        durationMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
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
