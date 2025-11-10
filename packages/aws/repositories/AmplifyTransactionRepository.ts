import type { AmplifyDataClient } from './types';
import { TransactionEntity } from '../models';
import { TransactionRepository } from './TransactionRepository';
import { PaginationResult } from './BaseRepository';

export class AmplifyTransactionRepository implements TransactionRepository {
  constructor(private dbClient: AmplifyDataClient) {}

  async findById(id: string): Promise<TransactionEntity | null> {
    const response = await this.dbClient.models.Transaction.get({
      transactionId: id,
    });
    if (!response.data) {
      return null;
    }
    return this.toTransaction(response.data);
  }

  async findAll(): Promise<TransactionEntity[]> {
    const response = await this.dbClient.models.Transaction.list({});
    return response.data.map((item: any) => this.toTransaction(item));
  }

  async save(entity: TransactionEntity): Promise<TransactionEntity> {
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
      category: entity.category,
      primaryCategory: entity.primaryCategory,
      pending: entity.pending,
      personId: entity.personId,
      receiptUrls: entity.receiptUrls,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      profileOwner: entity.profileOwner,
    });

    if (!response.data) {
      throw new Error('Failed to create Transaction: response.data is null');
    }
    return this.toTransaction(response.data);
  }

  async update(
    id: string,
    entity: Partial<TransactionEntity>
  ): Promise<TransactionEntity> {
    const updates: any = { transactionId: id };

    if (entity.amount !== undefined) updates.amount = entity.amount;
    if (entity.date !== undefined)
      updates.date = entity.date;
    if (entity.authorizedDate !== undefined)
      updates.authorizedDate = entity.authorizedDate;
    if (entity.merchantName !== undefined)
      updates.merchantName = entity.merchantName;
    if (entity.name !== undefined) updates.name = entity.name;
    if (entity.category !== undefined) updates.category = entity.category;
    if (entity.primaryCategory !== undefined)
      updates.primaryCategory = entity.primaryCategory;
    if (entity.pending !== undefined) updates.pending = entity.pending;
    if (entity.personId !== undefined) updates.personId = entity.personId;
    if (entity.receiptUrls !== undefined)
      updates.receiptUrls = entity.receiptUrls;
    if (entity.updatedAt !== undefined)
      updates.updatedAt = entity.updatedAt;

    const response = await this.dbClient.models.Transaction.update(updates);
    if (!response.data) {
      throw new Error('Failed to update Transaction: response.data is null');
    }
    return this.toTransaction(response.data);
  }

  async delete(id: string): Promise<void> {
    await this.dbClient.models.Transaction.delete({ transactionId: id });
  }

  async findByOrganization(
    organizationId: string,
    limit: number = 50,
    cursor?: string
  ): Promise<PaginationResult<TransactionEntity>> {
    const response =
      await this.dbClient.models.Transaction.listTransactionByOrganizationIdAndDate(
        {
          organizationId,
        },
        {
          limit,
          nextToken: cursor,
        }
      );

    return {
      items: response.data.map((item: any) => this.toTransaction(item)),
      nextCursor: response.nextToken ?? undefined,
      hasMore: !!response.nextToken,
    };
  }

  async findByFinancialAccount(
    financialAccountId: string,
    limit: number = 50,
    cursor?: string
  ): Promise<PaginationResult<TransactionEntity>> {
    const response =
      await this.dbClient.models.Transaction.listTransactionByFinancialAccountIdAndDate(
        {
          financialAccountId,
        },
        {
          limit,
          nextToken: cursor,
        }
      );

    return {
      items: response.data.map((item: any) => this.toTransaction(item)),
      nextCursor: response.nextToken ?? undefined,
      hasMore: !!response.nextToken,
    };
  }

  async findByPerson(
    personId: string,
    limit: number = 50,
    cursor?: string
  ): Promise<PaginationResult<TransactionEntity>> {
    const response =
      await this.dbClient.models.Transaction.listTransactionByPersonIdAndDate(
        {
          personId,
        },
        {
          limit,
          nextToken: cursor,
        }
      );

    return {
      items: response.data.map((item: any) => this.toTransaction(item)),
      nextCursor: response.nextToken ?? undefined,
      hasMore: !!response.nextToken,
    };
  }

  async findByDateRange(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<TransactionEntity[]> {
    // Note: DynamoDB range queries work on sort keys
    // We'll fetch all for the org and filter client-side
    // For better performance, consider using query with date range filter
    const allTransactions = await this.findByOrganization(organizationId);
    return allTransactions.items.filter(
      (txn: any) => txn.date >= startDate && txn.date <= endDate
    );
  }

  async findByExternalTransactionId(
    externalTransactionId: string
  ): Promise<TransactionEntity | null> {
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
  }

  async findRecent(
    organizationId: string,
    limit: number
  ): Promise<TransactionEntity[]> {
    const response =
      await this.dbClient.models.Transaction.listTransactionByOrganizationIdAndDate(
        {
          organizationId,
        },
        {
          limit,
        }
      );

    return response.data.map((item: any) => this.toTransaction(item));
  }

  /**
   * Convert Amplify Transaction entity to TransactionEntity
   */
  private toTransaction(data: any): TransactionEntity {
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
      category: data.category ?? [],
      primaryCategory: data.primaryCategory ?? undefined,
      pending: data.pending,
      personId: data.personId ?? undefined,
      receiptUrls: data.receiptUrls ?? [],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      profileOwner: data.profileOwner ?? undefined,
    };
  }
}
