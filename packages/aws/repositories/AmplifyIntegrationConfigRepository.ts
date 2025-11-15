import { IntegrationConfigRepository } from '@nueink/core';
import { IntegrationConfigEntity } from '../models';
import type { AmplifyDataClient } from './types';

export class AmplifyIntegrationConfigRepository implements IntegrationConfigRepository<IntegrationConfigEntity> {
  constructor(private dbClient: AmplifyDataClient) {}

  public findById = async (id: string): Promise<IntegrationConfigEntity | null> => {
    const response = await this.dbClient.models.IntegrationConfig.get({ integrationId: id });
    if (!response.data) {
      return null;
    }
    return this.toIntegrationConfig(response.data);
  };

  public findAll = async (): Promise<IntegrationConfigEntity[]> => {
    const response = await this.dbClient.models.IntegrationConfig.list({});
    return response.data.map((item: any) => this.toIntegrationConfig(item));
  };

  public save = async (entity: IntegrationConfigEntity): Promise<IntegrationConfigEntity> => {
    const response = await this.dbClient.models.IntegrationConfig.create({
      integrationId: entity.integrationId,
      accountId: entity.accountId,
      organizationId: entity.organizationId,
      provider: entity.provider,
      expiresAt: entity.expiresAt,
      status: entity.status,
      syncedAt: entity.syncedAt,
      lastSyncError: entity.lastSyncError,
      syncEnabled: entity.syncEnabled,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      profileOwner: entity.profileOwner,
    });

    if (!response.data) {
      throw new Error('Failed to create IntegrationConfig: response.data is null');
    }
    return this.toIntegrationConfig(response.data);
  };

  public update = async (
    id: string,
    entity: Partial<IntegrationConfigEntity>
  ): Promise<IntegrationConfigEntity> => {
    const updates: any = { integrationId: id };

    if (entity.expiresAt !== undefined) updates.expiresAt = entity.expiresAt;
    if (entity.status !== undefined) updates.status = entity.status;
    if (entity.syncedAt !== undefined) updates.syncedAt = entity.syncedAt;
    if (entity.lastSyncError !== undefined) updates.lastSyncError = entity.lastSyncError;
    if (entity.syncEnabled !== undefined) updates.syncEnabled = entity.syncEnabled;
    if (entity.updatedAt !== undefined) updates.updatedAt = entity.updatedAt;

    const response = await this.dbClient.models.IntegrationConfig.update(updates);
    if (!response.data) {
      throw new Error('Failed to update IntegrationConfig: response.data is null');
    }
    return this.toIntegrationConfig(response.data);
  };

  public delete = async (id: string): Promise<void> => {
    await this.dbClient.models.IntegrationConfig.delete({ integrationId: id });
  };

  public findByAccountId = async (accountId: string): Promise<IntegrationConfigEntity[]> => {
    const response = await this.dbClient.models.IntegrationConfig.listIntegrationConfigByAccountId({
      accountId,
    });
    return response.data.map((item: any) => this.toIntegrationConfig(item));
  };

  public findByAccountIdAndProvider = async (accountId: string, provider: string): Promise<IntegrationConfigEntity | null> => {
    // Query by accountId, then filter by provider
    const response = await this.dbClient.models.IntegrationConfig.listIntegrationConfigByAccountId({
      accountId,
    });

    const filtered = response.data.filter((item: any) => item.provider === provider);
    if (filtered.length === 0) {
      return null;
    }
    return this.toIntegrationConfig(filtered[0]);
  };

  public findByOrganizationId = async (organizationId: string): Promise<IntegrationConfigEntity[]> => {
    const response = await this.dbClient.models.IntegrationConfig.listIntegrationConfigByOrganizationId({
      organizationId,
    });
    return response.data.map((item: any) => this.toIntegrationConfig(item));
  };

  public findActiveByAccountId = async (accountId: string): Promise<IntegrationConfigEntity[]> => {
    const all = await this.findByAccountId(accountId);
    return all.filter(config => config.status === 'active');
  };

  public findAllActive = async (): Promise<IntegrationConfigEntity[]> => {
    const all = await this.findAll();
    return all.filter(config => config.status === 'active' && config.syncEnabled);
  };

  private toIntegrationConfig = (data: any): IntegrationConfigEntity => {
    return {
      integrationId: data.integrationId,
      accountId: data.accountId,
      organizationId: data.organizationId,
      provider: data.provider,
      expiresAt: data.expiresAt,
      status: data.status,
      syncedAt: data.syncedAt,
      lastSyncError: data.lastSyncError,
      syncEnabled: data.syncEnabled,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      profileOwner: data.profileOwner,
    };
  };
}
