import { FinancialProvider, IntegrationConfigStatus } from './types';

/**
 * IntegrationConfig domain model
 * Stores user's financial integration credentials and sync state
 *
 * Security: OAuth tokens stored in AWS Secrets Manager (not in DB)
 * Secret name computed from: "nueink/integration/{accountId}/{provider}"
 */
export interface IntegrationConfig {
  integrationId: string;
  accountId: string;              // User's account ID
  organizationId: string;          // Organization this integration belongs to
  provider: FinancialProvider;     // ynab, plaid, manual
  expiresAt?: Date;                // Token expiration timestamp (cached for convenience)
  status: IntegrationConfigStatus; // active, disabled, error, expired
  syncedAt?: Date;                 // Last successful sync timestamp
  syncInProgress?: boolean;        // True when sync is actively running
  syncStartedAt?: Date;            // When current/last sync started
  lastSyncError?: string;          // Last error message (if any)
  syncEnabled: boolean;            // User can disable sync temporarily
  createdAt: Date;
  updatedAt: Date;
  profileOwner: string;
}
