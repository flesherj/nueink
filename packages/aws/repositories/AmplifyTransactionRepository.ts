import { TransactionRepository, PaginationResult } from '@nueink/core';
import type { AmplifyDataClient } from './types';
import { TransactionEntity } from '../models';

export class AmplifyTransactionRepository
  implements TransactionRepository<TransactionEntity>
{
  constructor(private dbClient: AmplifyDataClient) {}

  public findById = async (id: string): Promise<TransactionEntity | null> => {
    const response = await this.dbClient.models.Transaction.get({
      transactionId: id,
    });
    if (!response.data) {
      return null;
    }
    return this.toTransaction(response.data);
  };

  public findAll = async (): Promise<TransactionEntity[]> => {
    const response = await this.dbClient.models.Transaction.list({});
    return response.data ? response.data.map((item: any) => this.toTransaction(item)) : [];
  };

  public save = async (entity: TransactionEntity): Promise<TransactionEntity> => {
    const response = await this.dbClient.models.Transaction.create({
      transactionId: entity.transactionId,
      financialAccountId: entity.financialAccountId,
      organizationId: entity.organizationId,
      provider: entity.provider,
      externalTransactionId: entity.externalTransactionId,
      amount: entity.amount,
      currency: entity.currency,
      date: entity.date,
      authorizedDate: entity.authorizedDate,
      merchantName: entity.merchantName,
      name: entity.name,
      status: entity.status,
      pending: entity.pending,
      personId: entity.personId,
      receiptUrls: entity.receiptUrls,
      rawData: entity.rawData,
      syncedAt: entity.syncedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      profileOwner: entity.profileOwner,
    });

    if (!response.data) {
      throw new Error('Failed to create Transaction: response.data is null');
    }
    return this.toTransaction(response.data);
  };

  public update = async (
    id: string,
    entity: Partial<TransactionEntity>
  ): Promise<TransactionEntity> => {
    const updates: any = { transactionId: id };

    // Only include defined, non-null values in the update
    if (entity.amount !== undefined && entity.amount !== null) updates.amount = entity.amount;
    if (entity.date !== undefined && entity.date !== null)
      updates.date = entity.date;
    if (entity.authorizedDate !== undefined && entity.authorizedDate !== null)
      updates.authorizedDate = entity.authorizedDate;
    if (entity.merchantName !== undefined && entity.merchantName !== null)
      updates.merchantName = entity.merchantName;
    if (entity.name !== undefined && entity.name !== null) updates.name = entity.name;
    if (entity.status !== undefined && entity.status !== null) updates.status = entity.status;
    if (entity.pending !== undefined && entity.pending !== null) updates.pending = entity.pending;
    if (entity.personId !== undefined && entity.personId !== null) updates.personId = entity.personId;
    if (entity.receiptUrls !== undefined && entity.receiptUrls !== null)
      updates.receiptUrls = entity.receiptUrls;
    if (entity.rawData !== undefined && entity.rawData !== null) updates.rawData = entity.rawData;
    if (entity.syncedAt !== undefined && entity.syncedAt !== null) updates.syncedAt = entity.syncedAt;
    if (entity.updatedAt !== undefined && entity.updatedAt !== null)
      updates.updatedAt = entity.updatedAt;

    const response = await this.dbClient.models.Transaction.update(updates);
    if (!response.data) {
      throw new Error('Failed to update Transaction: response.data is null');
    }
    return this.toTransaction(response.data);
  };

  public delete = async (id: string): Promise<void> => {
    await this.dbClient.models.Transaction.delete({ transactionId: id });
  };

  public findByOrganization = async (
    organizationId: string,
    limit: number = 50,
    cursor?: string
  ): Promise<PaginationResult<TransactionEntity>> => {
    const response =
      await this.dbClient.models.Transaction.listTransactionByOrganizationIdAndDate(
        {
          organizationId,
        },
        {
          limit,
          nextToken: cursor,
          sortDirection: 'DESC', // Most recent first
        }
      );

    return {
      items: response.data ? response.data.map((item: any) => this.toTransaction(item)) : [],
      nextCursor: response.nextToken ?? undefined,
      hasMore: !!response.nextToken,
    };
  };

  public findByFinancialAccount = async (
    financialAccountId: string,
    limit: number = 50,
    cursor?: string
  ): Promise<PaginationResult<TransactionEntity>> => {
    const response =
      await this.dbClient.models.Transaction.listTransactionByFinancialAccountIdAndDate(
        {
          financialAccountId,
        },
        {
          limit,
          nextToken: cursor,
          sortDirection: 'DESC', // Most recent first
        }
      );

    return {
      items: response.data ? response.data.map((item: any) => this.toTransaction(item)) : [],
      nextCursor: response.nextToken ?? undefined,
      hasMore: !!response.nextToken,
    };
  };

  public findByPerson = async (
    personId: string,
    limit: number = 50,
    cursor?: string
  ): Promise<PaginationResult<TransactionEntity>> => {
    const response =
      await this.dbClient.models.Transaction.listTransactionByPersonIdAndDate(
        {
          personId,
        },
        {
          limit,
          nextToken: cursor,
          sortDirection: 'DESC', // Most recent first
        }
      );

    return {
      items: response.data ? response.data.map((item: any) => this.toTransaction(item)) : [],
      nextCursor: response.nextToken ?? undefined,
      hasMore: !!response.nextToken,
    };
  };

  public findByDateRange = async (
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<TransactionEntity[]> => {
    // Note: DynamoDB range queries work on sort keys
    // We'll fetch all for the org and filter client-side
    // For better performance, consider using query with date range filter
    const allTransactions = await this.findByOrganization(organizationId);
    return allTransactions.items.filter(
      (txn: any) => txn.date >= startDate && txn.date <= endDate
    );
  };

  public findByExternalTransactionId = async (
    externalTransactionId: string
  ): Promise<TransactionEntity | null> => {
    const response =
      await this.dbClient.models.Transaction.listTransactionByExternalTransactionId(
        {
          externalTransactionId,
        }
      );
    if (response.data.length === 0) {
      return null;
    }
    return this.toTransaction(response.data[0]);
  };

  public findRecent = async (
    organizationId: string,
    limit: number
  ): Promise<TransactionEntity[]> => {
    const response =
      await this.dbClient.models.Transaction.listTransactionByOrganizationIdAndDate(
        {
          organizationId,
        },
        {
          limit,
          sortDirection: 'DESC', // Most recent first
        }
      );

    return response.data.map((item: any) => this.toTransaction(item));
  };

  /**
   * Convert Amplify Transaction entity to TransactionEntity
   */
  private toTransaction = (data: any): TransactionEntity => {
    return {
      transactionId: data.transactionId,
      financialAccountId: data.financialAccountId,
      organizationId: data.organizationId,
      provider: data.provider,
      externalTransactionId: data.externalTransactionId ?? undefined,
      amount: data.amount,
      currency: data.currency,
      date: data.date,
      authorizedDate: data.authorizedDate ?? undefined,
      merchantName: data.merchantName ?? undefined,
      name: data.name,
      status: data.status,
      pending: data.pending,
      personId: data.personId ?? undefined,
      receiptUrls: data.receiptUrls ?? [],
      rawData: data.rawData ?? undefined,
      syncedAt: data.syncedAt ?? undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      profileOwner: data.profileOwner ?? undefined,
    };
  };
}
