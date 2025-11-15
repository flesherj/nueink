import { AwsAmplifyApiFactory } from './AwsAmplifyApiFactory';
import type { FinancialAccount } from '@nueink/core';

export type PaginationResult<T> = {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
};

/**
 * Financial Account API Client
 *
 * Client-side API for financial account operations.
 * All requests are authenticated with Cognito credentials.
 */
export class FinancialAccountApi {
  private api = AwsAmplifyApiFactory.getInstance();

  public static create = () => new FinancialAccountApi();

  /**
   * List financial accounts for an organization
   * GET /financial-account/organization/:organizationId?limit=50&cursor=...
   */
  public listByOrganization = async (
    organizationId: string,
    options?: { limit?: number; cursor?: string }
  ): Promise<PaginationResult<FinancialAccount>> => {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.cursor) params.append('cursor', options.cursor);

    const url = `/financial-account/organization/${organizationId}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.api.get(url).response;
    return (await response.body.json()) as PaginationResult<FinancialAccount>;
  };

  /**
   * Get financial account by ID
   * GET /financial-account/:financialAccountId
   */
  public getAccount = async (financialAccountId: string): Promise<FinancialAccount> => {
    const response = await this.api.get(`/financial-account/${financialAccountId}`).response;
    return (await response.body.json()) as FinancialAccount;
  };

  /**
   * List financial accounts for a specific institution
   * GET /financial-account/institution/:institutionId
   */
  public listByInstitution = async (institutionId: string): Promise<FinancialAccount[]> => {
    const response = await this.api.get(`/financial-account/institution/${institutionId}`).response;
    return (await response.body.json()) as FinancialAccount[];
  };
}
