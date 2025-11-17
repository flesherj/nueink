import {
  IntegrationConfig,
  IntegrationTokens,
  IntegrationTokenUpdate,
  FinancialProvider,
} from '../models';
import { IntegrationConfigConverter } from '../converters';
import { IntegrationConfigRepository } from '../repositories';
import { IntegrationConfigEntity } from '@nueink/aws';
import type { SecretManager } from './SecretManager';
import type { EventPublisher } from '../events';

/**
 * Integration service - handles business logic for financial integrations
 *
 * Responsibilities:
 * - Integration CRUD operations
 * - Token management via SecretManager
 * - Secret name computation (nueink/integration/{accountId}/{provider})
 * - Token serialization/deserialization (Date handling)
 * - Sync orchestration via EventPublisher
 */
export class IntegrationService {
  private converter: IntegrationConfigConverter;
  private secretManager?: SecretManager;
  private eventPublisher?: EventPublisher;
  private repository: IntegrationConfigRepository<IntegrationConfigEntity>;

  constructor(
    repository: IntegrationConfigRepository<IntegrationConfigEntity>,
    secretManager?: SecretManager,
    eventPublisher?: EventPublisher
  ) {
    this.repository = repository;
    this.converter = new IntegrationConfigConverter();
    this.secretManager = secretManager;
    this.eventPublisher = eventPublisher;
  }

  /**
   * Ensure SecretManager is available for token operations
   * Throws error if called from client-side without SecretManager
   */
  private requireSecretManager = (): SecretManager => {
    if (!this.secretManager) {
      throw new Error(
        'SecretManager not available - token operations can only be performed server-side (Lambda)'
      );
    }
    return this.secretManager;
  };

  /**
   * Ensure EventPublisher is available for sync operations
   * Throws error if called from client-side without EventPublisher
   */
  private requireEventPublisher = (): EventPublisher => {
    if (!this.eventPublisher) {
      throw new Error(
        'EventPublisher not available - sync operations can only be performed server-side (Lambda)'
      );
    }
    return this.eventPublisher;
  };

  // ========== Integration CRUD Operations ==========

  public findById = async (id: string): Promise<IntegrationConfig | null> => {
    const entity = await this.repository.findById(id);
    return entity ? this.converter.toDomain(entity) : null;
  };

  public findAll = async (): Promise<IntegrationConfig[]> => {
    const entities = await this.repository.findAll();
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public findByAccountId = async (
    accountId: string
  ): Promise<IntegrationConfig[]> => {
    const entities = await this.repository.findByAccountId(accountId);
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public findByAccountIdAndProvider = async (
    accountId: string,
    provider: string
  ): Promise<IntegrationConfig | null> => {
    const entity = await this.repository.findByAccountIdAndProvider(
      accountId,
      provider
    );
    return entity ? this.converter.toDomain(entity) : null;
  };

  public findByOrganizationId = async (
    organizationId: string
  ): Promise<IntegrationConfig[]> => {
    const entities = await this.repository.findByOrganizationId(organizationId);
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public findActiveByAccountId = async (
    accountId: string
  ): Promise<IntegrationConfig[]> => {
    const entities = await this.repository.findActiveByAccountId(accountId);
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public listActiveIntegrations = async (): Promise<IntegrationConfig[]> => {
    const entities = await this.repository.findAllActive();
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public create = async (
    config: IntegrationConfig
  ): Promise<IntegrationConfig> => {
    const entity = this.converter.toEntity(config);
    const saved = await this.repository.save(entity);
    return this.converter.toDomain(saved);
  };

  public update = async (
    id: string,
    updates: Partial<IntegrationConfig>
  ): Promise<IntegrationConfig> => {
    const entityUpdates = this.converter.toEntity(updates as IntegrationConfig);
    const updated = await this.repository.update(id, entityUpdates);
    return this.converter.toDomain(updated);
  };

  public delete = async (id: string): Promise<void> => {
    await this.repository.delete(id);
  };

  // ========== Token Management ==========

  /**
   * Compute secret name from accountId and provider
   * Pattern: nueink/integration/{accountId}/{provider}
   */
  private computeSecretName = (
    accountId: string,
    provider: FinancialProvider
  ): string => {
    return `nueink/integration/${accountId}/${provider}`;
  };

  /**
   * Store OAuth tokens for an integration
   * Creates a new secret or updates existing one
   */
  public storeTokens = async (
    accountId: string,
    provider: FinancialProvider,
    tokens: IntegrationTokens
  ): Promise<void> => {
    const secretManager = this.requireSecretManager();
    const secretName = this.computeSecretName(accountId, provider);
    const secretValue = this.serializeTokens(tokens);

    // Check if secret already exists
    const exists = await secretManager.secretExists(secretName);

    if (exists) {
      // Update existing secret
      await secretManager.updateSecret(secretName, secretValue);
    } else {
      // Create new secret with tags
      const tags = {
        AccountId: accountId,
        Provider: provider,
        Purpose: 'oauth-tokens',
      };
      await secretManager.storeSecret(secretName, secretValue, tags);
    }
  };

  /**
   * Retrieve OAuth tokens for an integration
   */
  public getTokens = async (
    accountId: string,
    provider: FinancialProvider
  ): Promise<IntegrationTokens | null> => {
    const secretManager = this.requireSecretManager();
    const secretName = this.computeSecretName(accountId, provider);
    const secretValue = await secretManager.getSecret(secretName);

    if (!secretValue) {
      return null;
    }

    return this.deserializeTokens(secretValue);
  };

  /**
   * Update OAuth tokens (e.g., after token refresh)
   * Merges with existing tokens - only provided fields are updated
   */
  public updateTokens = async (
    accountId: string,
    provider: FinancialProvider,
    updates: IntegrationTokenUpdate
  ): Promise<void> => {
    const secretManager = this.requireSecretManager();

    // Get existing tokens to merge
    const existing = await this.getTokens(accountId, provider);
    if (!existing) {
      throw new Error(
        `Cannot update tokens - no tokens exist for ${accountId}/${provider}`
      );
    }

    // Merge updates with existing tokens
    const merged: IntegrationTokens = {
      accessToken: updates.accessToken ?? existing.accessToken,
      refreshToken: updates.refreshToken ?? existing.refreshToken,
      expiresAt: updates.expiresAt ?? existing.expiresAt,
    };

    const secretName = this.computeSecretName(accountId, provider);
    const secretValue = this.serializeTokens(merged);
    await secretManager.updateSecret(secretName, secretValue);
  };

  /**
   * Delete OAuth tokens (e.g., when user disconnects integration)
   */
  public deleteTokens = async (
    accountId: string,
    provider: FinancialProvider
  ): Promise<void> => {
    const secretManager = this.requireSecretManager();
    const secretName = this.computeSecretName(accountId, provider);
    await secretManager.deleteSecret(secretName);
  };

  /**
   * Check if tokens need refresh
   * Returns true if:
   * - No expiresAt date (safe default)
   * - expiresAt is within 5 minutes of expiring
   * - expiresAt has already passed
   */
  public needsTokenRefresh = async (
    accountId: string,
    provider: FinancialProvider
  ): Promise<boolean> => {
    const tokens = await this.getTokens(accountId, provider);

    if (!tokens) {
      return false; // No tokens = can't refresh
    }

    if (!tokens.expiresAt) {
      return false; // No expiry date = assume valid
    }

    // Refresh if within 5 minutes of expiry or already expired
    const bufferMs = 5 * 60 * 1000; // 5 minutes
    const now = new Date().getTime();
    const expiryTime = tokens.expiresAt.getTime();

    return expiryTime - now <= bufferMs;
  };

  /**
   * Check if integration has a refresh token available
   */
  public hasRefreshToken = async (
    accountId: string,
    provider: FinancialProvider
  ): Promise<boolean> => {
    const tokens = await this.getTokens(accountId, provider);
    return !!tokens?.refreshToken;
  };

  /**
   * Update last sync time and clear errors
   * Called after successful sync to update integration status
   */
  public updateLastSyncTime = async (
    accountId: string,
    provider: FinancialProvider
  ): Promise<void> => {
    const config = await this.findByAccountIdAndProvider(accountId, provider);
    if (!config) {
      throw new Error(`Integration not found for ${accountId}/${provider}`);
    }

    await this.update(config.integrationId, {
      syncedAt: new Date(),
      syncInProgress: false,     // Clear in-progress flag
      lastSyncError: undefined,  // Clear any previous errors
      updatedAt: new Date(),
    });
  };

  /**
   * Mark sync as failed and record error
   * Called when sync encounters an error
   */
  public markSyncFailed = async (
    accountId: string,
    provider: FinancialProvider,
    error: string
  ): Promise<void> => {
    const config = await this.findByAccountIdAndProvider(accountId, provider);
    if (!config) {
      throw new Error(`Integration not found for ${accountId}/${provider}`);
    }

    await this.update(config.integrationId, {
      syncInProgress: false,  // Clear in-progress flag
      lastSyncError: error,   // Record error
      updatedAt: new Date(),
    });
  };

  // ========== Sync Orchestration ==========

  /**
   * Trigger a manual sync for an organization
   * Publishes a ManualSyncTriggered event that the sync Lambda will consume
   *
   * @param organizationId - Organization to sync
   * @param triggeredBy - User ID or system identifier that triggered the sync
   * @throws Error if organizationId is missing or event publishing fails
   */
  public triggerManualSync = async (
    organizationId: string,
    triggeredBy: string = 'user'
  ): Promise<void> => {
    if (!organizationId) {
      throw new Error('organizationId is required');
    }

    const eventPublisher = this.requireEventPublisher();

    await eventPublisher.publish({
      source: 'nueink.financial.manual',
      detailType: 'ManualSyncTriggered',
      detail: JSON.stringify({
        organizationId,
        triggeredAt: new Date().toISOString(),
        triggeredBy,
      }),
    });
  };

  /**
   * Trigger a sync when a new integration is connected
   * Publishes an IntegrationConnected event
   *
   * @param accountId - NueInk account ID
   * @param provider - Financial provider name (ynab, plaid, etc.)
   * @param organizationId - Organization ID
   * @throws Error if required parameters are missing or event publishing fails
   */
  public triggerIntegrationSync = async (
    accountId: string,
    provider: FinancialProvider,
    organizationId: string
  ): Promise<void> => {
    if (!accountId || !provider || !organizationId) {
      throw new Error('accountId, provider, and organizationId are required');
    }

    const eventPublisher = this.requireEventPublisher();

    await eventPublisher.publish({
      source: 'nueink.financial',
      detailType: 'IntegrationConnected',
      detail: JSON.stringify({
        integrations: [
          {
            accountId,
            provider,
          },
        ],
        organizationId,
        triggeredAt: new Date().toISOString(),
      }),
    });
  };

  /**
   * Serialize tokens to secret storage format
   */
  private serializeTokens = (
    tokens: IntegrationTokens
  ): Record<string, any> => {
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_at: tokens.expiresAt?.toISOString(),
    };
  };

  /**
   * Deserialize tokens from secret storage format
   */
  private deserializeTokens = (
    secretValue: Record<string, any>
  ): IntegrationTokens => {
    return {
      accessToken: secretValue.access_token,
      refreshToken: secretValue.refresh_token,
      expiresAt: secretValue.expires_at
        ? new Date(secretValue.expires_at)
        : undefined,
    };
  };
}
