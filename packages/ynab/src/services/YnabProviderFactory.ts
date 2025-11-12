/**
 * YNAB Provider Factory
 *
 * Creates YnabSyncProvider instances with proper configuration.
 * Encapsulates the construction logic for YNAB integrations.
 */

import { api as YNABApi } from 'ynab';
import type { ProviderFactory, IntegrationTokens } from '@nueink/core';
import { YnabIntegration } from '../client/YnabIntegration';
import { YnabSyncProvider } from './YnabSyncProvider';

export class YnabProviderFactory implements ProviderFactory {
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
}
