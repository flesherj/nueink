import { api as YNABApi } from 'ynab';
import type {
  FinancialIntegration,
  FinancialAccount,
  Transaction,
  IntegrationStatus,
} from '@nueink/core';
import {
  YnabAccountConverter,
  type YnabAccountConversionContext,
  YnabTransactionConverter,
  type YnabTransactionConversionContext,
} from '../converters';

/**
 * YNAB Integration
 *
 * Implements FinancialIntegration interface for YNAB (You Need A Budget).
 * Fetches data from YNAB API and converts to NueInk's normalized types.
 */
export class YnabIntegration implements FinancialIntegration {
  private ynabClient: YNABApi;
  private accountConverter: YnabAccountConverter;
  private transactionConverter: YnabTransactionConverter;
  private budgetId: string | null = null;
  private lastSyncTime: Date | null = null;

  constructor(
    ynabClient: YNABApi,
    private organizationId: string,
    private profileOwner: string
  ) {
    this.ynabClient = ynabClient;
    this.accountConverter = new YnabAccountConverter();
    this.transactionConverter = new YnabTransactionConverter();
  }

  /**
   * Get all financial accounts from YNAB
   */
  public getAccounts = async (): Promise<Array<FinancialAccount>> => {
    const budgetId = await this.getDefaultBudgetId();
    const response = await this.ynabClient.accounts.getAccounts(budgetId);

    const context: YnabAccountConversionContext = {
      budgetId,
      organizationId: this.organizationId,
      profileOwner: this.profileOwner,
    };

    this.lastSyncTime = new Date();

    return response.data.accounts.map(account =>
      this.accountConverter.convert(account, context)
    );
  };

  /**
   * Get transactions within a date range
   */
  public getTransactions = async (
    startDate: string,
    endDate?: string
  ): Promise<Array<Transaction>> => {
    const budgetId = await this.getDefaultBudgetId();
    const response = await this.ynabClient.transactions.getTransactions(
      budgetId,
      startDate
    );

    const context: YnabTransactionConversionContext = {
      organizationId: this.organizationId,
      profileOwner: this.profileOwner,
    };

    this.lastSyncTime = new Date();

    let transactions = response.data.transactions.map(transaction =>
      this.transactionConverter.convert(transaction, context)
    );

    // Filter by end date if provided
    if (endDate) {
      const endDateTime = new Date(endDate).getTime();
      transactions = transactions.filter(
        t => t.date.getTime() <= endDateTime
      );
    }

    return transactions;
  };

  /**
   * Get transactions for a specific account
   */
  public getAccountTransactions = async (
    accountId: string,
    startDate: string,
    endDate?: string
  ): Promise<Array<Transaction>> => {
    const budgetId = await this.getDefaultBudgetId();
    const response = await this.ynabClient.transactions.getTransactionsByAccount(
      budgetId,
      accountId,
      startDate
    );

    const context: YnabTransactionConversionContext = {
      organizationId: this.organizationId,
      profileOwner: this.profileOwner,
    };

    this.lastSyncTime = new Date();

    let transactions = response.data.transactions.map(transaction =>
      this.transactionConverter.convert(transaction, context)
    );

    // Filter by end date if provided
    if (endDate) {
      const endDateTime = new Date(endDate).getTime();
      transactions = transactions.filter(
        t => t.date.getTime() <= endDateTime
      );
    }

    return transactions;
  };

  /**
   * Refresh account balances
   */
  public refreshBalances = async (): Promise<Array<FinancialAccount>> => {
    // YNAB doesn't have a separate balance refresh endpoint
    // Just re-fetch all accounts
    return this.getAccounts();
  };

  /**
   * Get the current status of the YNAB integration
   */
  public getStatus = async (): Promise<IntegrationStatus> => {
    try {
      await this.ynabClient.user.getUser();
      return {
        connected: true,
        lastSync: this.lastSyncTime || undefined,
      };
    } catch (error) {
      return {
        connected: false,
        lastSync: this.lastSyncTime || undefined,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  /**
   * Get the default budget ID (or first budget if no default)
   */
  private getDefaultBudgetId = async (): Promise<string> => {
    if (this.budgetId) {
      return this.budgetId;
    }

    const response = await this.ynabClient.budgets.getBudgets();
    const budgets = response.data.budgets;

    if (budgets.length === 0) {
      throw new Error('No YNAB budgets found');
    }

    // Use first budget (YNAB doesn't have a "default" concept)
    this.budgetId = budgets[0].id;
    return this.budgetId;
  };
}
