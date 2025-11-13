import { defineFunction, secret } from '@aws-amplify/backend';

/**
 * OAuth secrets for financial providers
 */
export const OAuthSecrets = {
  YNAB_TOKEN_URL: 'YNAB_TOKEN_URL',
  YNAB_CLIENT_ID: 'YNAB_CLIENT_ID',
  YNAB_CLIENT_SECRET: 'YNAB_CLIENT_SECRET',
  YNAB_REDIRECT_URI: 'YNAB_REDIRECT_URI',
  PLAID_CLIENT_ID: 'PLAID_CLIENT_ID',
  PLAID_SECRET: 'PLAID_SECRET',
  PLAID_ENVIRONMENT: 'PLAID_ENVIRONMENT', // sandbox | development | production
} as const;

export const financialConnect = defineFunction({
  name: 'financial-connect',
  timeoutSeconds: 30,
  environment: {
    YNAB_TOKEN_URL: secret(OAuthSecrets.YNAB_TOKEN_URL),
    YNAB_CLIENT_ID: secret(OAuthSecrets.YNAB_CLIENT_ID),
    YNAB_CLIENT_SECRET: secret(OAuthSecrets.YNAB_CLIENT_SECRET),
    YNAB_REDIRECT_URI: secret(OAuthSecrets.YNAB_REDIRECT_URI),
    PLAID_CLIENT_ID: secret(OAuthSecrets.PLAID_CLIENT_ID),
    PLAID_SECRET: secret(OAuthSecrets.PLAID_SECRET),
    PLAID_ENVIRONMENT: secret(OAuthSecrets.PLAID_ENVIRONMENT),
  },
});
