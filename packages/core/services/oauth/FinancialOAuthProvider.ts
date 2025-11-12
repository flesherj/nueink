/**
 * Financial OAuth Provider Interface
 *
 * Defines the contract that all financial integration OAuth providers must implement.
 * This allows for a pluggable architecture where new providers can be added without
 * modifying core business logic.
 */

export interface OAuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>; // Provider-specific metadata (e.g., Plaid's item_id)
}

/**
 * Configuration required for OAuth operations
 * Each provider should define their specific config type that extends this
 */
export interface OAuthConfig {
  [key: string]: any;
}

/**
 * Interface that all financial OAuth providers must implement
 *
 * Providers are configured at instantiation time with their specific config,
 * eliminating the need to pass config on every method call.
 */
export interface FinancialOAuthProvider {
  /**
   * Exchange an authorization code for access and refresh tokens
   *
   * @param authorizationCode - The code received from the provider's authorization endpoint
   * @returns Token response with access token, optional refresh token, and expiration
   */
  exchangeAuthorizationCode(authorizationCode: string): Promise<OAuthTokenResponse>;

  /**
   * Refresh an expired access token using a refresh token
   * Optional - some providers (like Plaid) don't support token refresh
   *
   * @param refreshToken - The refresh token from a previous token exchange
   * @returns New token response with fresh access token
   */
  refreshAccessToken?(refreshToken: string): Promise<OAuthTokenResponse>;
}
