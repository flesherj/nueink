import { AwsAmplifyApiFactory } from './AwsAmplifyApiFactory';
import type { IntegrationConfig } from '@nueink/core';

/**
 * Integration API Client
 *
 * Client-side API for integration operations.
 * All requests are authenticated with Cognito credentials.
 */
export class IntegrationApi {
  private api = AwsAmplifyApiFactory.getInstance();

  public static create = () => new IntegrationApi();

  /**
   * List integrations for an account
   * GET /integration/:accountId
   */
  public listByAccount = async (accountId: string): Promise<IntegrationConfig[]> => {
    const response = await this.api.get(`/integration/${accountId}`).response;
    return (await response.body.json()) as unknown as IntegrationConfig[];
  };

  /**
   * Trigger manual sync for an integration
   * POST /integration/:accountId/sync
   */
  public triggerSync = async (
    accountId: string,
    provider: 'ynab' | 'plaid'
  ): Promise<{ message: string; accountId: string; provider: string }> => {
    const response = await this.api.post(`/integration/${accountId}/sync`, { provider }).response;
    return (await response.body.json()) as unknown as { message: string; accountId: string; provider: string };
  };
}
