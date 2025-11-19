import { AwsAmplifyApiFactory } from './AwsAmplifyApiFactory';
import type { TransactionSplit } from '@nueink/core';
import type { PaginationResult } from './types';

/**
 * TransactionSplit API Client
 *
 * Client-side API for transaction split operations.
 * All requests are authenticated with Cognito credentials.
 */
export class TransactionSplitApi {
  private api = AwsAmplifyApiFactory.getInstance();

  public static create = () => new TransactionSplitApi();

  /**
   * List splits for a transaction
   * GET /transaction-split/transaction/:transactionId
   */
  public listByTransaction = async (transactionId: string): Promise<TransactionSplit[]> => {
    const response = await this.api.get(`/transaction-split/transaction/${transactionId}`).response;
    return (await response.body.json()) as unknown as TransactionSplit[];
  };

  /**
   * List splits for an organization and category
   * GET /transaction-split/organization/:organizationId/category/:category?limit=50&cursor=...
   */
  public listByOrganizationAndCategory = async (
    organizationId: string,
    category: string,
    options?: { limit?: number; cursor?: string }
  ): Promise<PaginationResult<TransactionSplit>> => {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.cursor) params.append('cursor', options.cursor);

    const url = `/transaction-split/organization/${organizationId}/category/${category}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.api.get(url).response;
    return (await response.body.json()) as unknown as PaginationResult<TransactionSplit>;
  };

  /**
   * Get split by ID
   * GET /transaction-split/:splitId
   */
  public getSplit = async (splitId: string): Promise<TransactionSplit> => {
    const response = await this.api.get(`/transaction-split/${splitId}`).response;
    return (await response.body.json()) as unknown as TransactionSplit;
  };

  /**
   * Create a new transaction split
   * POST /transaction-split
   */
  public create = async (split: Omit<TransactionSplit, 'splitId' | 'createdAt' | 'updatedAt'>): Promise<TransactionSplit> => {
    const response = await this.api.post('/transaction-split', split).response;
    return (await response.body.json()) as unknown as TransactionSplit;
  };

  /**
   * Update all splits for a transaction
   * PUT /transaction-split/transaction/:transactionId
   *
   * Replaces all splits for a transaction. Automatically tracks feedback
   * when updating AI-generated categorizations.
   */
  public updateTransactionSplits = async (
    transactionId: string,
    accountId: string,
    transactionAmount: number,
    splits: Omit<TransactionSplit, 'splitId' | 'createdAt' | 'updatedAt'>[]
  ): Promise<TransactionSplit[]> => {
    const response = await this.api.put(`/transaction-split/transaction/${transactionId}`, {
      splits,
      accountId,
      transactionAmount,
    }).response;
    return (await response.body.json()) as unknown as TransactionSplit[];
  };

  /**
   * Delete a transaction split
   * DELETE /transaction-split/:splitId
   */
  public delete = async (splitId: string): Promise<void> => {
    await this.api.del(`/transaction-split/${splitId}`).response;
  };
}
