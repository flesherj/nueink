import { defineFunction, secret } from '@aws-amplify/backend';

/**
 * Secrets for financial sync - includes OAuth credentials for token refresh
 */
export const SyncSecrets = {
  YNAB_TOKEN_URL: 'YNAB_TOKEN_URL',
  YNAB_CLIENT_ID: 'YNAB_CLIENT_ID',
  YNAB_CLIENT_SECRET: 'YNAB_CLIENT_SECRET',
  YNAB_REDIRECT_URI: 'YNAB_REDIRECT_URI',
  PLAID_CLIENT_ID: 'PLAID_CLIENT_ID',
  PLAID_SECRET: 'PLAID_SECRET',
  PLAID_ENVIRONMENT: 'PLAID_ENVIRONMENT',
} as const;

export const financialSync = defineFunction({
  name: 'financial-sync',
  timeoutSeconds: 300, // 5 minutes (syncs can take a while)
  environment: {
    YNAB_TOKEN_URL: secret(SyncSecrets.YNAB_TOKEN_URL),
    YNAB_CLIENT_ID: secret(SyncSecrets.YNAB_CLIENT_ID),
    YNAB_CLIENT_SECRET: secret(SyncSecrets.YNAB_CLIENT_SECRET),
    YNAB_REDIRECT_URI: secret(SyncSecrets.YNAB_REDIRECT_URI),
    PLAID_CLIENT_ID: secret(SyncSecrets.PLAID_CLIENT_ID),
    PLAID_SECRET: secret(SyncSecrets.PLAID_SECRET),
    PLAID_ENVIRONMENT: secret(SyncSecrets.PLAID_ENVIRONMENT),
  },
});
