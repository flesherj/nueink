import type {
  FinancialAccount,
  FinancialIntegration,
  IntegrationStatus,
  Transaction,
} from '@nueink/core';
import { PlaidApi } from 'plaid';

/**
 * Plaid Integration
 *
 * Wraps PlaidApi to implement FinancialIntegration interface.
 * Holds both the PlaidApi client (with app credentials) and the user's access token.
 */
export class PlaidIntegration implements FinancialIntegration {
  private plaidClient: PlaidApi;
  private accessToken: string;

  constructor(plaidClient: PlaidApi, accessToken: string) {
    this.plaidClient = plaidClient;
    this.accessToken = accessToken;
  }

  public getAccounts = async (): Promise<Array<FinancialAccount>> => {
    const response = await this.plaidClient.accountsGet({
      access_token: this.accessToken,
    });

    // TODO: Convert Plaid accounts to NueInk FinancialAccount format
    // For now, returning empty array - need to implement converter
    return [];
  };

  public getTransactions = async (
    startDate: string,
    endDate?: string
  ): Promise<Array<Transaction>> => {
    const response = await this.plaidClient.transactionsGet({
      access_token: this.accessToken,
      start_date: startDate,
      end_date: endDate || new Date().toISOString().split('T')[0],
    });

    // TODO: Convert Plaid transactions to NueInk Transaction format
    // For now, returning empty array - need to implement converter
    return [];
  };

  public getAccountTransactions = async (
    accountId: string,
    startDate: string,
    endDate?: string
  ): Promise<Array<Transaction>> => {
    // Plaid doesn't have a per-account transaction endpoint
    // Fetch all transactions and filter by financialAccountId
    const allTransactions = await this.getTransactions(startDate, endDate);
    return allTransactions.filter(t => t.financialAccountId === accountId);
  };

  public refreshBalances = async (): Promise<Array<FinancialAccount>> => {
    const response = await this.plaidClient.accountsBalanceGet({
      access_token: this.accessToken,
    });

    // TODO: Convert Plaid accounts to NueInk FinancialAccount format
    // For now, returning empty array - need to implement converter
    return [];
  };

  public getStatus = async (): Promise<IntegrationStatus> => {
    try {
      // Try to fetch accounts as a health check
      await this.plaidClient.accountsGet({
        access_token: this.accessToken,
      });

      return {
        connected: true,
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };
}
