import { InstitutionRepository } from '@nueink/core';
import type { AmplifyDataClient } from './types';
import { InstitutionEntity } from '../models';

export class AmplifyInstitutionRepository
  implements InstitutionRepository<InstitutionEntity>
{
  constructor(private dbClient: AmplifyDataClient) {}

  public findById = async (id: string): Promise<InstitutionEntity | null> => {
    const response = await this.dbClient.models.Institution.get({
      institutionId: id,
    });
    if (!response.data) {
      return null;
    }
    return this.toInstitution(response.data);
  };

  public findAll = async (): Promise<InstitutionEntity[]> => {
    const response = await this.dbClient.models.Institution.list({});
    return response.data.map((item: any) => this.toInstitution(item));
  };

  public save = async (entity: InstitutionEntity): Promise<InstitutionEntity> => {
    const response = await this.dbClient.models.Institution.create({
      institutionId: entity.institutionId,
      organizationId: entity.organizationId,
      provider: entity.provider,
      externalId: entity.externalId,
      externalItemId: entity.externalItemId,
      name: entity.name,
      logo: entity.logo,
      status: entity.status,
      lastSyncedAt: entity.lastSyncedAt,
      createdAt: entity.createdAt,
      profileOwner: entity.profileOwner,
    });

    if (!response.data) {
      throw new Error('Failed to create Institution: response.data is null');
    }
    return this.toInstitution(response.data);
  };

  public update = async (
    id: string,
    entity: Partial<InstitutionEntity>
  ): Promise<InstitutionEntity> => {
    const updates: any = { institutionId: id };

    if (entity.name !== undefined) updates.name = entity.name;
    if (entity.logo !== undefined) updates.logo = entity.logo;
    if (entity.status !== undefined) updates.status = entity.status;
    if (entity.lastSyncedAt !== undefined)
      updates.lastSyncedAt = entity.lastSyncedAt;

    const response = await this.dbClient.models.Institution.update(updates);
    if (!response.data) {
      throw new Error('Failed to update Institution: response.data is null');
    }
    return this.toInstitution(response.data);
  };

  public delete = async (id: string): Promise<void> => {
    await this.dbClient.models.Institution.delete({ institutionId: id });
  };

  public findByOrganization = async (organizationId: string): Promise<InstitutionEntity[]> => {
    const response =
      await this.dbClient.models.Institution.listInstitutionByOrganizationId({
        organizationId,
      });
    return response.data.map((item: any) => this.toInstitution(item));
  };

  public findByExternalItemId = async (
    externalItemId: string
  ): Promise<InstitutionEntity | null> => {
    const response =
      await this.dbClient.models.Institution.listInstitutionByExternalItemId({
        externalItemId,
      });
    if (response.data.length === 0) {
      return null;
    }
    return this.toInstitution(response.data[0]);
  };

  public findByProvider = async (
    organizationId: string,
    provider: string
  ): Promise<InstitutionEntity[]> => {
    // Note: This requires filtering - fetch all for org and filter client-side
    const allInstitutions = await this.findByOrganization(organizationId);
    return allInstitutions.filter((inst: any) => inst.provider === provider);
  };

  /**
   * Convert Amplify Institution entity to InstitutionEntity
   */
  private toInstitution = (data: any): InstitutionEntity => {
    return {
      institutionId: data.institutionId,
      organizationId: data.organizationId,
      provider: data.provider,
      externalId: data.externalId ?? undefined,
      externalItemId: data.externalItemId ?? undefined,
      name: data.name,
      logo: data.logo ?? undefined,
      status: data.status,
      lastSyncedAt: data.lastSyncedAt ?? undefined,
      createdAt: data.createdAt,
      profileOwner: data.profileOwner ?? undefined,
    };
  };
}
