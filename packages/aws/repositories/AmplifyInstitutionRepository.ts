import { generateClient } from 'aws-amplify/data';
import { type Schema } from '../amplify/data/resource';
import { InstitutionEntity } from '../models';
import { InstitutionRepository } from './InstitutionRepository';

export class AmplifyInstitutionRepository implements InstitutionRepository {
  constructor(private dbClient = generateClient<Schema>()) {}

  async findById(id: string): Promise<InstitutionEntity | null> {
    const response = await this.dbClient.models.Institution.get({
      institutionId: id,
    });
    if (!response.data) {
      return null;
    }
    return this.toInstitution(response.data);
  }

  async findAll(): Promise<InstitutionEntity[]> {
    const response = await this.dbClient.models.Institution.list();
    return response.data.map((item) => this.toInstitution(item));
  }

  async save(entity: InstitutionEntity): Promise<InstitutionEntity> {
    const response = await this.dbClient.models.Institution.create({
      institutionId: entity.institutionId,
      organizationId: entity.organizationId,
      provider: entity.provider,
      externalId: entity.externalId,
      externalItemId: entity.externalItemId,
      name: entity.name,
      logo: entity.logo,
      status: entity.status,
      lastSyncedAt: entity.lastSyncedAt?.toISOString(),
      createdAt: entity.createdAt.toISOString(),
      profileOwner: entity.profileOwner,
    });

    return this.toInstitution(response.data!);
  }

  async update(
    id: string,
    entity: Partial<InstitutionEntity>
  ): Promise<InstitutionEntity> {
    const updates: any = { institutionId: id };

    if (entity.name !== undefined) updates.name = entity.name;
    if (entity.logo !== undefined) updates.logo = entity.logo;
    if (entity.status !== undefined) updates.status = entity.status;
    if (entity.lastSyncedAt !== undefined)
      updates.lastSyncedAt = entity.lastSyncedAt.toISOString();

    const response = await this.dbClient.models.Institution.update(updates);
    return this.toInstitution(response.data!);
  }

  async delete(id: string): Promise<void> {
    await this.dbClient.models.Institution.delete({ institutionId: id });
  }

  async findByOrganization(organizationId: string): Promise<InstitutionEntity[]> {
    const response =
      await this.dbClient.models.Institution.listInstitutionByOrganizationId({
        organizationId,
      });
    return response.data.map((item) => this.toInstitution(item));
  }

  async findByExternalItemId(
    externalItemId: string
  ): Promise<InstitutionEntity | null> {
    const response =
      await this.dbClient.models.Institution.listInstitutionByExternalItemId({
        externalItemId,
      });
    if (response.data.length === 0) {
      return null;
    }
    return this.toInstitution(response.data[0]);
  }

  async findByProvider(
    organizationId: string,
    provider: string
  ): Promise<InstitutionEntity[]> {
    // Note: This requires filtering - fetch all for org and filter client-side
    const allInstitutions = await this.findByOrganization(organizationId);
    return allInstitutions.filter((inst) => inst.provider === provider);
  }

  /**
   * Convert Amplify Institution entity to InstitutionEntity
   */
  private toInstitution(data: any): InstitutionEntity {
    return {
      institutionId: data.institutionId,
      organizationId: data.organizationId,
      provider: data.provider,
      externalId: data.externalId ?? undefined,
      externalItemId: data.externalItemId ?? undefined,
      name: data.name,
      logo: data.logo ?? undefined,
      status: data.status,
      lastSyncedAt: data.lastSyncedAt ? new Date(data.lastSyncedAt) : undefined,
      createdAt: new Date(data.createdAt),
      profileOwner: data.profileOwner ?? undefined,
    };
  }
}
