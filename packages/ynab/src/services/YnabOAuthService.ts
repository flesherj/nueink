/**
 * YNAB OAuth Service
 *
 * Handles OAuth token exchange and refresh for YNAB integration.
 * Implements the OAuth 2.0 authorization code flow as specified by YNAB.
 *
 * @see https://api.ynab.com/v1#/Authorization
 */

import type { FinancialOAuthProvider, OAuthTokenResponse, OAuthConfig, HttpClient } from '@nueink/core';
import { AxiosHttpClient } from '@nueink/core';

export interface YnabOAuthConfig extends OAuthConfig {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export class YnabOAuthProvider implements FinancialOAuthProvider {
  private httpClient: HttpClient;
  private config: YnabOAuthConfig;

  constructor(config: YnabOAuthConfig, httpClient?: HttpClient) {
    this.config = config;
    this.httpClient = httpClient || new AxiosHttpClient();
  }

  /**
   * Exchange authorization code for access and refresh tokens
   *
   * YNAB OAuth Flow:
   * - POST to token URL (typically https://app.youneedabudget.com/oauth/token)
   * - Request: client_id, client_secret, redirect_uri, grant_type, code
   * - Response: access_token, refresh_token, token_type, expires_in
   *
   * @param authorizationCode - The code returned by YNAB after user authorization
   * @returns Token response with access token, refresh token, and expiration
   * @throws Error if token exchange fails
   */
  public exchangeAuthorizationCode = async (
    authorizationCode: string
  ): Promise<OAuthTokenResponse> => {

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri,
      grant_type: 'authorization_code',
      code: authorizationCode,
    });

    try {
      const response = await this.httpClient.post(this.config.tokenUrl, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 30000, // 30 second timeout
      });

      // Calculate expiration date from expires_in (seconds)
      const expiresAt = response.data.expires_in
        ? new Date(Date.now() + response.data.expires_in * 1000)
        : undefined;

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data || error.message;
      console.error('YNAB token exchange failed:', error.response?.status, errorMessage);
      throw new Error(`YNAB token exchange failed: ${errorMessage}`);
    }
  }

  /**
   * Refresh an expired access token using a refresh token
   *
   * @param refreshToken - The refresh token from a previous token exchange
   * @returns New token response with fresh access token
   * @throws Error if token refresh fails
   */
  refreshAccessToken = async (
    refreshToken: string
  ): Promise<OAuthTokenResponse> => {

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    try {
      const response = await this.httpClient.post(this.config.tokenUrl, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 30000, // 30 second timeout
      });

      const expiresAt = response.data.expires_in
        ? new Date(Date.now() + response.data.expires_in * 1000)
        : undefined;

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || refreshToken, // Use new refresh token if provided, otherwise keep old one
        expiresAt,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data || error.message;
      console.error('YNAB token refresh failed:', error.response?.status, errorMessage);
      throw new Error(`YNAB token refresh failed: ${errorMessage}`);
    }
  }
}
