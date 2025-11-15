import { AwsAmplifyApiFactory } from './AwsAmplifyApiFactory';
import type { Transaction } from '@nueink/core';

export type PaginationResult<T> = {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
};

/**
 * Transaction API Client
 *
 * Client-side API for transaction operations.
 * All requests are authenticated with Cognito credentials.
 */
export class TransactionApi {
  private api = AwsAmplifyApiFactory.getInstance();

  public static create = () => new TransactionApi();

  /**
   * List transactions for an organization
   * GET /transaction/organization/:organizationId?limit=50&cursor=...
   */
  public listByOrganization = async (
    organizationId: string,
    options?: { limit?: number; cursor?: string }
  ): Promise<PaginationResult<Transaction>> => {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.cursor) params.append('cursor', options.cursor);

    const url = `/transaction/organization/${organizationId}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.api.get(url).response;
    return (await response.body.json()) as PaginationResult<Transaction>;
  };

  /**
   * List transactions for a financial account
   * GET /transaction/account/:financialAccountId?limit=50&cursor=...
   */
  public listByAccount = async (
    financialAccountId: string,
    options?: { limit?: number; cursor?: string }
  ): Promise<PaginationResult<Transaction>> => {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.cursor) params.append('cursor', options.cursor);

    const url = `/transaction/account/${financialAccountId}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.api.get(url).response;
    return (await response.body.json()) as PaginationResult<Transaction>;
  };

  /**
   * Get transaction by ID
   * GET /transaction/:transactionId
   */
  public getTransaction = async (transactionId: string): Promise<Transaction> => {
    const response = await this.api.get(`/transaction/${transactionId}`).response;
    return (await response.body.json()) as Transaction;
  };
}
