import { TransactionSplitRepository, PaginationResult } from '@nueink/core';
import type { AmplifyDataClient } from './types';
import { TransactionSplitEntity } from '../models';

export class AmplifyTransactionSplitRepository
  implements TransactionSplitRepository<TransactionSplitEntity>
{
  constructor(private dbClient: AmplifyDataClient) {}

  public findById = async (id: string): Promise<TransactionSplitEntity | null> => {
    const response = await this.dbClient.models.TransactionSplit.get({ splitId: id });
    if (!response.data) {
      return null;
    }
    return this.toTransactionSplit(response.data);
  };

  public findAll = async (): Promise<TransactionSplitEntity[]> => {
    const response = await this.dbClient.models.TransactionSplit.list({});
    return response.data.map((item: any) => this.toTransactionSplit(item));
  };

  public save = async (entity: TransactionSplitEntity): Promise<TransactionSplitEntity> => {
    const response = await this.dbClient.models.TransactionSplit.create({
      splitId: entity.splitId,
      transactionId: entity.transactionId,
      organizationId: entity.organizationId,
      category: entity.category,
      amount: entity.amount,
      percentage: entity.percentage,
      notes: entity.notes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      profileOwner: entity.profileOwner,
    });

    if (!response.data) {
      throw new Error('Failed to create TransactionSplit: response.data is null');
    }
    return this.toTransactionSplit(response.data);
  };

  public update = async (
    id: string,
    entity: Partial<TransactionSplitEntity>
  ): Promise<TransactionSplitEntity> => {
    const updates: any = { splitId: id };

    if (entity.category !== undefined) updates.category = entity.category;
    if (entity.amount !== undefined) updates.amount = entity.amount;
    if (entity.percentage !== undefined) updates.percentage = entity.percentage;
    if (entity.notes !== undefined) updates.notes = entity.notes;
    if (entity.updatedAt !== undefined) updates.updatedAt = entity.updatedAt;

    const response = await this.dbClient.models.TransactionSplit.update(updates);
    if (!response.data) {
      throw new Error('Failed to update TransactionSplit: response.data is null');
    }
    return this.toTransactionSplit(response.data);
  };

  public delete = async (id: string): Promise<void> => {
    await this.dbClient.models.TransactionSplit.delete({ splitId: id });
  };

  public findByTransaction = async (transactionId: string): Promise<TransactionSplitEntity[]> => {
    const response =
      await this.dbClient.models.TransactionSplit.listTransactionSplitByTransactionId({
        transactionId,
      });
    return response.data.map((item: any) => this.toTransactionSplit(item));
  };

  public findByOrganizationAndCategory = async (
    organizationId: string,
    category: string,
    limit: number = 50,
    cursor?: string
  ): Promise<PaginationResult<TransactionSplitEntity>> => {
    const response =
      await this.dbClient.models.TransactionSplit.listTransactionSplitByOrganizationIdAndCategory(
        {
          organizationId,
          category: { eq: category },
        },
        {
          limit,
          nextToken: cursor,
        }
      );

    return {
      items: response.data.map((item: any) => this.toTransactionSplit(item)),
      nextCursor: response.nextToken ?? undefined,
      hasMore: !!response.nextToken,
    };
  };

  public findByCategory = async (category: string): Promise<TransactionSplitEntity[]> => {
    const response =
      await this.dbClient.models.TransactionSplit.listTransactionSplitByCategory({
        category,
      });
    return response.data.map((item: any) => this.toTransactionSplit(item));
  };

  public deleteByTransaction = async (transactionId: string): Promise<void> => {
    // Fetch all splits for the transaction
    const splits = await this.findByTransaction(transactionId);

    // Delete each split
    await Promise.all(splits.map((split) => this.delete(split.splitId)));
  };

  /**
   * Convert Amplify TransactionSplit entity to TransactionSplitEntity
   */
  private toTransactionSplit = (data: any): TransactionSplitEntity => {
    return {
      splitId: data.splitId,
      transactionId: data.transactionId,
      organizationId: data.organizationId,
      category: data.category,
      amount: data.amount,
      percentage: data.percentage ?? undefined,
      notes: data.notes ?? undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      profileOwner: data.profileOwner ?? undefined,
    };
  };
}
