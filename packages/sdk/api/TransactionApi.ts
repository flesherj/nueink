import { AwsAmplifyApiFactory } from './AwsAmplifyApiFactory';
import type { Transaction } from '@nueink/core';
import type { PaginationResult } from './types';
import { convertTransactionsFromResponse, convertTransactionFromResponse, type TransactionResponse } from './TransactionConverter';

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
    const apiResult = (await response.body.json()) as unknown as PaginationResult<TransactionResponse>;

    // Convert API responses to domain models with properly parsed dates
    return {
      ...apiResult,
      items: convertTransactionsFromResponse(apiResult.items),
    };
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
    const apiResult = (await response.body.json()) as unknown as PaginationResult<TransactionResponse>;

    // Convert API responses to domain models with properly parsed dates
    return {
      ...apiResult,
      items: convertTransactionsFromResponse(apiResult.items),
    };
  };

  /**
   * Get transaction by ID
   * GET /transaction/:transactionId
   */
  public getTransaction = async (transactionId: string): Promise<Transaction> => {
    const response = await this.api.get(`/transaction/${transactionId}`).response;
    const apiResponse = (await response.body.json()) as unknown as TransactionResponse;

    // Convert API response to domain model with properly parsed dates
    return convertTransactionFromResponse(apiResponse);
  };
}
