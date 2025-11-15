/**
 * Financial OAuth Service
 *
 * Central service for handling OAuth flows across all financial providers.
 * Uses a provider registry pattern to route requests to the appropriate
 * provider implementation.
 *
 * This service acts as the single entry point for OAuth operations,
 * abstracting away provider-specific details from consumers (like Lambda functions).
 */

import type { FinancialProvider } from '../../models/types';
import type { FinancialOAuthProvider, OAuthTokenResponse } from './FinancialOAuthProvider';

/**
 * Financial OAuth Service
 *
 * Manages OAuth operations for financial integrations using a provider registry.
 */
export class FinancialOAuthService {
  private providers = new Map<FinancialProvider, FinancialOAuthProvider>();

  /**
   * Register a provider implementation
   *
   * @param provider - The provider identifier (e.g., 'ynab', 'plaid')
   * @param implementation - The concrete provider implementation
   */
  public registerProvider = (provider: FinancialProvider, implementation: FinancialOAuthProvider): void => {
    this.providers.set(provider, implementation);
  };

  /**
   * Exchange authorization code for access token
   *
   * Routes the request to the appropriate provider implementation based on
   * the provider identifier. The provider was already configured with its
   * specific config during registration.
   *
   * @param provider - The financial provider ('ynab', 'plaid', etc.)
   * @param authorizationCode - The authorization code from the OAuth flow
   * @returns Token response with access token and optional refresh token
   * @throws Error if provider is not supported or token exchange fails
   */
  public exchangeAuthorizationCode = async (
    provider: FinancialProvider,
    authorizationCode: string
  ): Promise<OAuthTokenResponse> => {
    const providerImpl = this.providers.get(provider);
    if (!providerImpl) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    return providerImpl.exchangeAuthorizationCode(authorizationCode);
  };

  /**
   * Refresh an expired access token
   *
   * Routes the request to the appropriate provider implementation.
   * Note: Not all providers support token refresh (e.g., Plaid tokens don't expire).
   *
   * @param provider - The financial provider
   * @param refreshToken - The refresh token
   * @returns New token response with fresh access token
   * @throws Error if provider doesn't support refresh or refresh fails
   */
  public refreshAccessToken = async (
    provider: FinancialProvider,
    refreshToken: string
  ): Promise<OAuthTokenResponse> => {
    const providerImpl = this.providers.get(provider);
    if (!providerImpl) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    if (!providerImpl.refreshAccessToken) {
      throw new Error(`Provider ${provider} does not support token refresh`);
    }

    return providerImpl.refreshAccessToken(refreshToken);
  };

  /**
   * Check if a provider supports token refresh
   *
   * @param provider - The financial provider to check
   * @returns True if the provider supports refresh tokens
   */
  public supportsTokenRefresh = (provider: FinancialProvider): boolean => {
    const providerImpl = this.providers.get(provider);
    return !!providerImpl?.refreshAccessToken;
  };
}
