import type {
  FinancialAccount,
  FinancialIntegration,
  IntegrationStatus,
  Transaction,
} from '@nueink/core';

export class NueInkPlaidIntegration implements FinancialIntegration {
  getAccounts(): Promise<Array<FinancialAccount>> {
    throw new Error('Method not implemented.');
  }
  getTransactions(
    startDate: string,
    endDate?: string
  ): Promise<Array<Transaction>> {
    throw new Error('Method not implemented.');
  }
  getAccountTransactions(
    accountId: string,
    startDate: string,
    endDate?: string
  ): Promise<Array<Transaction>> {
    throw new Error('Method not implemented.');
  }
  refreshBalances(): Promise<Array<FinancialAccount>> {
    throw new Error('Method not implemented.');
  }
  getStatus(): Promise<IntegrationStatus> {
    throw new Error('Method not implemented.');
  }
}
