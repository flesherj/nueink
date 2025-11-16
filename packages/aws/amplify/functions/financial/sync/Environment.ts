import type { YnabOAuthConfig } from '@nueink/ynab';

/**
 * Environment configuration for financial-sync Lambda
 * Centralizes all environment variable access with type safety
 * Values are computed once at module load time
 */
export const Environment = {
  /** EventBridge event bus name for publishing sync events (passed from CDK) */
  eventBusName: process.env.EVENT_BUS_NAME || '',

  /** AWS region for service calls */
  region: process.env.AWS_REGION || 'us-east-1',

  // ========== Plaid Configuration ==========

  /** Plaid client ID */
  plaidClientId: process.env.PLAID_CLIENT_ID || '',

  /** Plaid secret key */
  plaidSecret: process.env.PLAID_SECRET || '',

  /** Plaid environment (sandbox, development, production) */
  plaidEnvironment: process.env.PLAID_ENVIRONMENT || 'sandbox',

  // ========== Configuration Builders ==========

  /**
   * Build YNAB OAuth configuration from environment variables
   * Used to configure YnabProviderFactory for token refresh operations
   */
  ynabOAuthConfig: (): YnabOAuthConfig => ({
    tokenUrl: process.env.YNAB_TOKEN_URL || '',
    clientId: process.env.YNAB_CLIENT_ID || '',
    clientSecret: process.env.YNAB_CLIENT_SECRET || '',
    redirectUri: process.env.YNAB_REDIRECT_URI || '',
  }),
} as const;
