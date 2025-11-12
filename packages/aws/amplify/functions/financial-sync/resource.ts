import { defineFunction, secret } from '@aws-amplify/backend';

/**
 * Secrets for Plaid sync (YNAB credentials come from OAuth storage)
 */
export const SyncSecrets = {
  PLAID_CLIENT_ID: 'PLAID_CLIENT_ID',
  PLAID_SECRET: 'PLAID_SECRET',
  PLAID_ENVIRONMENT: 'PLAID_ENVIRONMENT',
} as const;

export const financialSync = defineFunction({
  name: 'financial-sync',
  timeoutSeconds: 300, // 5 minutes (syncs can take a while)
  environment: {
    PLAID_CLIENT_ID: secret(SyncSecrets.PLAID_CLIENT_ID),
    PLAID_SECRET: secret(SyncSecrets.PLAID_SECRET),
    PLAID_ENVIRONMENT: secret(SyncSecrets.PLAID_ENVIRONMENT),
  },
});
