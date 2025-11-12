/**
 * Plaid OAuth Service
 *
 * Handles Plaid Link public token exchange.
 * Note: Plaid uses a different flow than traditional OAuth.
 *
 * @see https://plaid.com/docs/api/tokens/#itempublic_tokenexchange
 */

import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import type { FinancialOAuthProvider, OAuthTokenResponse, OAuthConfig } from '@nueink/core';

export interface PlaidOAuthConfig extends OAuthConfig {
  clientId: string;
  secret: string;
  environment: 'sandbox' | 'development' | 'production';
}

export class PlaidOAuthProvider implements FinancialOAuthProvider {
  private config: PlaidOAuthConfig;

  constructor(config: PlaidOAuthConfig) {
    this.config = config;
  }

  /**
   * Exchange Plaid Link public_token for permanent access_token
   *
   * Plaid Flow (different from standard OAuth):
   * 1. User completes Plaid Link in mobile app
   * 2. Mobile app receives public_token from Plaid Link
   * 3. Mobile app sends public_token to backend (as "authorizationCode")
   * 4. Backend exchanges public_token for permanent access_token
   *
   * Note: Plaid access tokens are permanent (no expiration) unless revoked
   *
   * @param authorizationCode - The public token from Plaid Link (called "code" to match interface)
   * @returns Token response with permanent access token and item ID in metadata
   * @throws Error if token exchange fails
   */
  public exchangeAuthorizationCode = async (
    authorizationCode: string
  ): Promise<OAuthTokenResponse> => {

    // Map environment string to Plaid environment
    const environmentMap: Record<string, any> = {
      sandbox: PlaidEnvironments.sandbox,
      development: PlaidEnvironments.development,
      production: PlaidEnvironments.production,
    };

    const environment = environmentMap[this.config.environment] || PlaidEnvironments.sandbox;

    const configuration = new Configuration({
      basePath: environment,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': this.config.clientId,
          'PLAID-SECRET': this.config.secret,
        },
      },
    });

    const plaidClient = new PlaidApi(configuration);

    try {
      const response = await plaidClient.itemPublicTokenExchange({
        public_token: authorizationCode, // public_token passed as "authorizationCode"
      });

      // Plaid access tokens are permanent (no expiration)
      return {
        accessToken: response.data.access_token,
        refreshToken: undefined, // Plaid doesn't use refresh tokens
        expiresAt: undefined, // Access token is permanent
        metadata: {
          itemId: response.data.item_id, // Store Plaid item_id for future API calls
        },
      };
    } catch (error: any) {
      console.error('Plaid token exchange failed:', error.response?.data || error.message);
      throw new Error(`Plaid token exchange failed: ${error.response?.data?.error_message || error.message}`);
    }
  }
}
