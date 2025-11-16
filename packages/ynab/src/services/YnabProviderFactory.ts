/**
 * YNAB Provider Factory
 *
 * Creates YnabSyncProvider and YnabOAuthProvider instances with proper configuration.
 * Encapsulates the construction logic for YNAB integrations.
 */

import { api as YNABApi } from 'ynab';
import type { ProviderFactory, IntegrationTokens, FinancialOAuthProvider } from '@nueink/core';
import { YnabIntegration } from '../client/YnabIntegration';
import { YnabSyncProvider } from './YnabSyncProvider';
import { YnabOAuthProvider, YnabOAuthConfig } from './YnabOAuthService';

export class YnabProviderFactory implements ProviderFactory {
  private oauthConfig?: YnabOAuthConfig;

  constructor(oauthConfig?: YnabOAuthConfig) {
    this.oauthConfig = oauthConfig;
  }

  public createSyncProvider = (
    tokens: IntegrationTokens,
    organizationId: string,
    accountId: string
  ): YnabSyncProvider => {
    // Create YNAB API client with user's access token
    const ynabClient = new YNABApi(tokens.accessToken);

    // Create integration wrapper
    const integration = new YnabIntegration(ynabClient, organizationId, accountId);

    // Create and return sync provider
    return new YnabSyncProvider(integration);
  };

  public createOAuthProvider = (): FinancialOAuthProvider => {
    if (!this.oauthConfig) {
      throw new Error('OAuth config not provided to YnabProviderFactory - OAuth operations require server-side context');
    }

    return new YnabOAuthProvider(this.oauthConfig);
  };
}
