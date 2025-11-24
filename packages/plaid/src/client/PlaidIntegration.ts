import type {
  FinancialAccount,
  FinancialIntegration,
  IntegrationStatus,
  Transaction,
} from '@nueink/core';
import { PlaidApi } from 'plaid';
import {
  PlaidAccountConverter,
  PlaidAccountConversionContext,
  PlaidTransactionConverter,
  PlaidTransactionConversionContext,
} from '../converters';

/**
 * Plaid Integration
 *
 * Wraps PlaidApi to implement FinancialIntegration interface.
 * Holds both the PlaidApi client (with app credentials) and the user's access token.
 */
export class PlaidIntegration implements FinancialIntegration {
  private plaidClient: PlaidApi;
  private accessToken: string;
  private organizationId: string;
  private profileOwner: string;
  private accountConverter: PlaidAccountConverter;
  private transactionConverter: PlaidTransactionConverter;

  constructor(
    plaidClient: PlaidApi,
    accessToken: string,
    organizationId: string,
    profileOwner: string
  ) {
    this.plaidClient = plaidClient;
    this.accessToken = accessToken;
    this.organizationId = organizationId;
    this.profileOwner = profileOwner;
    this.accountConverter = new PlaidAccountConverter();
    this.transactionConverter = new PlaidTransactionConverter();
  }

  public getAccounts = async (): Promise<Array<FinancialAccount>> => {
    const response = await this.plaidClient.accountsGet({
      access_token: this.accessToken,
    });

    const context: PlaidAccountConversionContext = {
      organizationId: this.organizationId,
      profileOwner: this.profileOwner,
      institutionId: response.data.item.institution_id || undefined,
      institutionName: undefined, // Will be enriched separately if needed
    };

    return response.data.accounts.map(account =>
      this.accountConverter.convert(account, context)
    );
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

    const context: PlaidTransactionConversionContext = {
      organizationId: this.organizationId,
      profileOwner: this.profileOwner,
    };

    return response.data.transactions.map(transaction =>
      this.transactionConverter.convert(transaction, context)
    );
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

    const context: PlaidAccountConversionContext = {
      organizationId: this.organizationId,
      profileOwner: this.profileOwner,
      institutionId: response.data.item.institution_id || undefined,
      institutionName: undefined, // Will be enriched separately if needed
    };

    return response.data.accounts.map(account =>
      this.accountConverter.convert(account, context)
    );
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
