import { AwsAmplifyApiFactory } from './AwsAmplifyApiFactory';
import type { Account } from '@nueink/core';

/**
 * Account API Client
 *
 * Client-side API for account operations.
 * All requests are authenticated with Cognito credentials.
 */
export class AccountApi {
  private api = AwsAmplifyApiFactory.getInstance();

  public static create = () => new AccountApi();

  /**
   * Get account by ID
   * GET /account/:accountId
   */
  public getAccount = async (accountId: string): Promise<Account> => {
    const response = await this.api.get(`/account/${accountId}`).response;
    return (await response.body.json()) as Account;
  };

  /**
   * List all accounts (dev/admin only)
   * GET /account
   */
  public listAccounts = async (): Promise<Account[]> => {
    const response = await this.api.get('/account').response;
    return (await response.body.json()) as Account[];
  };
}
