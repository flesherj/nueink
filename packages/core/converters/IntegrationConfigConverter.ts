import { Converter } from './Converter';
import { IntegrationConfig } from '../models';
import { IntegrationConfigEntity } from '@nueink/aws';

/**
 * Converter for IntegrationConfig domain model and IntegrationConfigEntity
 */
export class IntegrationConfigConverter implements Converter<IntegrationConfigEntity, IntegrationConfig> {
  toEntity(domain: IntegrationConfig): IntegrationConfigEntity {
    return {
      integrationId: domain.integrationId,
      accountId: domain.accountId,
      organizationId: domain.organizationId,
      provider: domain.provider,
      expiresAt: domain.expiresAt?.toISOString(),
      status: domain.status,
      syncedAt: domain.syncedAt?.toISOString(),
      lastSyncError: domain.lastSyncError,
      syncEnabled: domain.syncEnabled,
      createdAt: domain.createdAt?.toISOString(),
      updatedAt: domain.updatedAt?.toISOString(),
      profileOwner: domain.profileOwner,
    };
  }

  toDomain(entity: IntegrationConfigEntity): IntegrationConfig {
    return {
      integrationId: entity.integrationId,
      accountId: entity.accountId,
      organizationId: entity.organizationId,
      provider: entity.provider,
      expiresAt: entity.expiresAt ? new Date(entity.expiresAt) : undefined,
      status: entity.status,
      syncedAt: entity.syncedAt ? new Date(entity.syncedAt) : undefined,
      lastSyncError: entity.lastSyncError,
      syncEnabled: entity.syncEnabled,
      createdAt: new Date(entity.createdAt),
      updatedAt: new Date(entity.updatedAt),
      profileOwner: entity.profileOwner!,
    };
  }
}
