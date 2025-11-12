/**
 * YNAB Sync Provider
 *
 * Implements FinancialSyncProvider interface for YNAB.
 * Wraps YnabIntegration to provide sync operations.
 */

import type {
  FinancialSyncProvider,
  SyncDateRange,
  SyncResult,
  FinancialAccount,
  Transaction,
} from '@nueink/core';
import { YnabIntegration } from '../client/YnabIntegration';

export class YnabSyncProvider implements FinancialSyncProvider {
  private integration: YnabIntegration;

  constructor(integration: YnabIntegration) {
    this.integration = integration;
  }

  /**
   * Sync all accounts from YNAB
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
      console.error('YNAB account sync failed:', error);
      return {
        data: [],
        success: false,
        error: error.message || 'Unknown error syncing YNAB accounts',
      };
    }
  };

  /**
   * Sync transactions for a date range
   */
  public syncTransactions = async (dateRange: SyncDateRange): Promise<SyncResult<Transaction>> => {
    try {
      // Format dates as YYYY-MM-DD (YNAB API format)
      const startDate = dateRange.startDate.toISOString().split('T')[0];
      const endDate = dateRange.endDate
        ? dateRange.endDate.toISOString().split('T')[0]
        : undefined;

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
      console.error('YNAB transaction sync failed:', error);
      return {
        data: [],
        success: false,
        error: error.message || 'Unknown error syncing YNAB transactions',
      };
    }
  };

  /**
   * Sync current balances
   * YNAB doesn't have a separate balance endpoint, so this fetches all accounts
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
      console.error('YNAB balance sync failed:', error);
      return {
        data: [],
        success: false,
        error: error.message || 'Unknown error syncing YNAB balances',
      };
    }
  };
}
