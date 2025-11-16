/**
 * Plaid Provider Factory
 *
 * Creates PlaidSyncProvider instances with proper configuration.
 * Encapsulates the construction logic for Plaid integrations.
 */

import type { PlaidApi } from 'plaid';
import type { ProviderFactory, IntegrationTokens, FinancialOAuthProvider } from '@nueink/core';
import { PlaidIntegration } from '../client/PlaidIntegration';
import { PlaidSyncProvider } from './PlaidSyncProvider';

/**
 * Factory for creating Plaid sync providers
 *
 * Unlike YNAB, Plaid requires app-level credentials (PlaidApi) that are shared
 * across all users. The factory holds the PlaidApi client and combines it with
 * each user's access token.
 */
export class PlaidProviderFactory implements ProviderFactory {
  private plaidClient: PlaidApi;

  constructor(plaidClient: PlaidApi) {
    this.plaidClient = plaidClient;
  }

  public createSyncProvider = (
    tokens: IntegrationTokens,
    organizationId: string,
    accountId: string
  ): PlaidSyncProvider => {
    // Create integration wrapper with shared PlaidApi client and user's access token
    const integration = new PlaidIntegration(this.plaidClient, tokens.accessToken);

    // Create and return sync provider
    return new PlaidSyncProvider(integration);
  };

  public createOAuthProvider = (): FinancialOAuthProvider => {
    // Plaid doesn't use OAuth token refresh - access tokens don't expire
    // Token rotation is handled via item_public_token_exchange
    throw new Error('Plaid does not support OAuth token refresh');
  };
}
