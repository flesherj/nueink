/**
 * Financial Sync Provider Interface
 *
 * Defines the contract that all financial data sync providers must implement.
 * Providers fetch account, transaction, and balance data from external services
 * (YNAB, Plaid, etc.) and return it in our standardized domain format.
 */

import type { FinancialAccount } from '../../models/FinancialAccount';
import type { Transaction } from '../../models/Transaction';

/**
 * Result of a sync operation
 */
export interface SyncResult<T> {
  data: T[];
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Date range for transaction syncs
 */
export interface SyncDateRange {
  startDate: Date;
  endDate?: Date; // Optional, defaults to today
}

/**
 * Interface that all financial sync providers must implement
 *
 * Providers wrap a FinancialIntegration instance that already has credentials configured.
 * Create a new provider instance for each user/integration.
 */
export interface FinancialSyncProvider {
  /**
   * Sync all financial accounts for a user
   *
   * @returns Accounts in NueInk domain format
   */
  syncAccounts(): Promise<SyncResult<FinancialAccount>>;

  /**
   * Sync transactions for a date range
   *
   * @param dateRange - Date range to fetch transactions for
   * @returns Transactions in NueInk domain format
   */
  syncTransactions(dateRange: SyncDateRange): Promise<SyncResult<Transaction>>;

  /**
   * Sync current balances for all accounts
   * This is typically faster than a full account sync
   *
   * @returns Updated accounts with current balances
   */
  syncBalances(): Promise<SyncResult<FinancialAccount>>;
}
