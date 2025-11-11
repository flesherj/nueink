import type { FinancialAccount } from './FinancialAccount';
import type { Transaction } from './Transaction';

/**
 * Integration Status
 *
 * Provides status information about a financial integration's connection
 */
export interface IntegrationStatus {
  /**
   * Whether the integration is currently connected and credentials are valid
   */
  connected: boolean;

  /**
   * Timestamp of the last successful data sync
   */
  lastSync?: Date;

  /**
   * Error message if connection failed
   */
  error?: string;
}

/**
 * Financial Integration Interface
 *
 * Defines the contract that all financial data providers must implement.
 * Each integration (YNAB, Plaid, etc.) transforms provider-specific data
 * into NueInk's normalized types.
 */
export interface FinancialIntegration {
  /**
   * Get all financial accounts for the authenticated user
   *
   * @returns Array of NueInk FinancialAccount objects
   */
  getAccounts(): Promise<Array<FinancialAccount>>;

  /**
   * Get transactions within a date range
   *
   * @param startDate - Start date for transaction range (ISO format YYYY-MM-DD)
   * @param endDate - Optional end date (defaults to today)
   * @returns Array of NueInk Transaction objects
   */
  getTransactions(startDate: string, endDate?: string): Promise<Array<Transaction>>;

  /**
   * Get transactions for a specific account
   *
   * @param accountId - NueInk financial account ID
   * @param startDate - Start date for transaction range (ISO format YYYY-MM-DD)
   * @param endDate - Optional end date (defaults to today)
   * @returns Array of NueInk Transaction objects
   */
  getAccountTransactions(
    accountId: string,
    startDate: string,
    endDate?: string
  ): Promise<Array<Transaction>>;

  /**
   * Refresh account balances
   *
   * @returns Updated array of NueInk FinancialAccount objects with fresh balances
   */
  refreshBalances(): Promise<Array<FinancialAccount>>;

  /**
   * Get the current status of the integration
   *
   * @returns Integration status with connection state, last sync time, and any errors
   */
  getStatus(): Promise<IntegrationStatus>;
}
