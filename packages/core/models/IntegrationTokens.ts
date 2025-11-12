/**
 * OAuth token data for integrations
 * Stored securely in secret management system
 */
export interface IntegrationTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

/**
 * Partial update for token refresh flows
 */
export interface IntegrationTokenUpdate {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
}
