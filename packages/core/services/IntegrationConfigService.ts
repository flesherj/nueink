import { IntegrationConfig, IntegrationTokens, IntegrationTokenUpdate, FinancialProvider } from '../models';
import { IntegrationConfigConverter } from '../converters';
import { IntegrationConfigRepository } from '../repositories';
import { IntegrationConfigEntity } from '@nueink/aws';
import type { SecretManager } from './SecretManager';

/**
 * IntegrationConfig service - handles business logic for integration configuration
 *
 * Responsibilities:
 * - Integration CRUD operations
 * - Token management via SecretManager
 * - Secret name computation (nueink/integration/{accountId}/{provider})
 * - Token serialization/deserialization (Date handling)
 */
export class IntegrationConfigService {
  private converter: IntegrationConfigConverter;
  private secretManager: SecretManager;

  constructor(
    repository: IntegrationConfigRepository<IntegrationConfigEntity>,
    secretManager: SecretManager
  ) {
    this.repository = repository;
    this.converter = new IntegrationConfigConverter();
    this.secretManager = secretManager;
  }

  private repository: IntegrationConfigRepository<IntegrationConfigEntity>;

  // ========== Integration CRUD Operations ==========

  public findById = async (id: string): Promise<IntegrationConfig | null> => {
    const entity = await this.repository.findById(id);
    return entity ? this.converter.toDomain(entity) : null;
  };

  public findAll = async (): Promise<IntegrationConfig[]> => {
    const entities = await this.repository.findAll();
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public findByAccountId = async (accountId: string): Promise<IntegrationConfig[]> => {
    const entities = await this.repository.findByAccountId(accountId);
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public findByAccountIdAndProvider = async (accountId: string, provider: string): Promise<IntegrationConfig | null> => {
    const entity = await this.repository.findByAccountIdAndProvider(accountId, provider);
    return entity ? this.converter.toDomain(entity) : null;
  };

  public findByOrganizationId = async (organizationId: string): Promise<IntegrationConfig[]> => {
    const entities = await this.repository.findByOrganizationId(organizationId);
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public findActiveByAccountId = async (accountId: string): Promise<IntegrationConfig[]> => {
    const entities = await this.repository.findActiveByAccountId(accountId);
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public create = async (config: IntegrationConfig): Promise<IntegrationConfig> => {
    const entity = this.converter.toEntity(config);
    const saved = await this.repository.save(entity);
    return this.converter.toDomain(saved);
  };

  public update = async (id: string, updates: Partial<IntegrationConfig>): Promise<IntegrationConfig> => {
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
  private computeSecretName = (accountId: string, provider: FinancialProvider): string => {
    return `nueink/integration/${accountId}/${provider}`;
  };

  /**
   * Store OAuth tokens for a new integration
   */
  public storeTokens = async (
    accountId: string,
    provider: FinancialProvider,
    tokens: IntegrationTokens
  ): Promise<void> => {
    const secretName = this.computeSecretName(accountId, provider);
    const secretValue = this.serializeTokens(tokens);

    // Add tags for cost allocation, auditing, and compliance
    const tags = {
      AccountId: accountId,
      Provider: provider,
      Purpose: 'oauth-tokens',
    };

    await this.secretManager.storeSecret(secretName, secretValue, tags);
  };

  /**
   * Retrieve OAuth tokens for an integration
   */
  public getTokens = async (
    accountId: string,
    provider: FinancialProvider
  ): Promise<IntegrationTokens | null> => {
    const secretName = this.computeSecretName(accountId, provider);
    const secretValue = await this.secretManager.getSecret(secretName);

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
    // Get existing tokens to merge
    const existing = await this.getTokens(accountId, provider);
    if (!existing) {
      throw new Error(`Cannot update tokens - no tokens exist for ${accountId}/${provider}`);
    }

    // Merge updates with existing tokens
    const merged: IntegrationTokens = {
      accessToken: updates.accessToken ?? existing.accessToken,
      refreshToken: updates.refreshToken ?? existing.refreshToken,
      expiresAt: updates.expiresAt ?? existing.expiresAt,
    };

    const secretName = this.computeSecretName(accountId, provider);
    const secretValue = this.serializeTokens(merged);
    await this.secretManager.updateSecret(secretName, secretValue);
  };

  /**
   * Delete OAuth tokens (e.g., when user disconnects integration)
   */
  public deleteTokens = async (accountId: string, provider: FinancialProvider): Promise<void> => {
    const secretName = this.computeSecretName(accountId, provider);
    await this.secretManager.deleteSecret(secretName);
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
   * Serialize tokens to secret storage format
   */
  private serializeTokens = (tokens: IntegrationTokens): Record<string, any> => {
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_at: tokens.expiresAt?.toISOString(),
    };
  };

  /**
   * Deserialize tokens from secret storage format
   */
  private deserializeTokens = (secretValue: Record<string, any>): IntegrationTokens => {
    return {
      accessToken: secretValue.access_token,
      refreshToken: secretValue.refresh_token,
      expiresAt: secretValue.expires_at ? new Date(secretValue.expires_at) : undefined,
    };
  };
}
