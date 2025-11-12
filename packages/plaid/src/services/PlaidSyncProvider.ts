/**
 * Plaid Sync Provider
 *
 * Implements FinancialSyncProvider interface for Plaid.
 * Wraps NueInkPlaidIntegration to provide sync operations.
 */

import type {
  FinancialSyncProvider,
  SyncDateRange,
  SyncResult,
  FinancialAccount,
  Transaction,
} from '@nueink/core';
import { PlaidIntegration } from '../client/PlaidIntegration';

export class PlaidSyncProvider implements FinancialSyncProvider {
  private integration: PlaidIntegration;

  constructor(integration: PlaidIntegration) {
    this.integration = integration;
  }

  /**
   * Sync all accounts from Plaid
   */
  public syncAccounts = async (): Promise<SyncResult<FinancialAccount>> => {
    try {
      const accounts = await this.integration.getAccounts();

      return {
        data: accounts,
        success: true,
        metadata: {
          count: accounts.length,
          syncedAt: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      console.error('Plaid account sync failed:', error);
      return {
        data: [],
        success: false,
        error: error.response?.data?.error_message || error.message || 'Unknown error syncing Plaid accounts',
      };
    }
  };

  /**
   * Sync transactions for a date range
   */
  public syncTransactions = async (dateRange: SyncDateRange): Promise<SyncResult<Transaction>> => {
    try {
      // Format dates as YYYY-MM-DD (Plaid API format)
      const startDate = dateRange.startDate.toISOString().split('T')[0];
      const endDate = dateRange.endDate
        ? dateRange.endDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const transactions = await this.integration.getTransactions(startDate, endDate);

      return {
        data: transactions,
        success: true,
        metadata: {
          count: transactions.length,
          startDate,
          endDate,
          syncedAt: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      console.error('Plaid transaction sync failed:', error);
      return {
        data: [],
        success: false,
        error: error.response?.data?.error_message || error.message || 'Unknown error syncing Plaid transactions',
      };
    }
  };

  /**
   * Sync current balances
   * Uses Plaid's balance endpoint which is faster than full account sync
   */
  public syncBalances = async (): Promise<SyncResult<FinancialAccount>> => {
    try {
      const accounts = await this.integration.refreshBalances();

      return {
        data: accounts,
        success: true,
        metadata: {
          count: accounts.length,
          syncedAt: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      console.error('Plaid balance sync failed:', error);
      return {
        data: [],
        success: false,
        error: error.response?.data?.error_message || error.message || 'Unknown error syncing Plaid balances',
      };
    }
  };
}
