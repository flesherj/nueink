import { FinancialProvider, IntegrationConfigStatus } from './types';

/**
 * IntegrationConfig AWS Entity
 * Stores user's financial integration credentials and sync state
 *
 * Security: OAuth tokens stored in AWS Secrets Manager (not in DB)
 * Secret name computed from: "nueink/integration/{accountId}/{provider}"
 */
export type IntegrationConfigEntity = {
  integrationId: string;
  accountId: string;              // User's account ID
  organizationId: string;          // Organization this integration belongs to
  provider: FinancialProvider;     // ynab, plaid, manual
  expiresAt?: string;              // Token expiration timestamp (ISO string, cached)
  status: IntegrationConfigStatus; // active, disabled, error, expired
  syncedAt?: string;               // Last successful sync timestamp (ISO string)
  lastTransactionSyncAt?: string;  // Last successful transaction sync timestamp (ISO string, for incremental sync)
  syncInProgress?: boolean;        // True when sync is actively running
  syncStartedAt?: string;          // When current/last sync started (ISO string)
  lastSyncError?: string;          // Last error message (if any)
  syncEnabled: boolean;            // User can disable sync temporarily
  createdAt: string;
  updatedAt: string;
  profileOwner?: string;
};
