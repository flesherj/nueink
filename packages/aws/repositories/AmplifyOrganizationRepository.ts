import { generateClient } from 'aws-amplify/data';
import { v4 as uuid } from 'uuid';

import { type Schema } from '../../../backend/data/resource';
import { OrganizationEntity, OrganizationType } from '../models';
import { OrganizationRepository } from './OrganizationRepository';

export class AmplifyOrganizationRepository implements OrganizationRepository {
  constructor(private dbClient = generateClient<Schema>()) {}

  async findById(id: string): Promise<OrganizationEntity | null> {
    const response = await this.dbClient.models.Organization.get({ orgId: id });
    if (!response.data) {
      return null;
    }
    return this.toOrganization(response.data);
  }

  async findAll(): Promise<OrganizationEntity[]> {
    const response = await this.dbClient.models.Organization.list();
    return response.data.map((item) => this.toOrganization(item));
  }

  async save(entity: OrganizationEntity): Promise<OrganizationEntity> {
    const response = await this.dbClient.models.Organization.create({
      orgId: entity.orgId,
      name: entity.name,
      type: entity.type,
      parentOrgId: entity.parentOrgId,
      createdByAccountId: entity.createdByAccountId,
      createdAt: entity.createdAt.toISOString(),
      status: entity.status,
      profileOwner: entity.profileOwner,
    });

    return this.toOrganization(response.data!);
  }

  async update(id: string, entity: Partial<OrganizationEntity>): Promise<OrganizationEntity> {
    const updates: any = { orgId: id };

    if (entity.name !== undefined) updates.name = entity.name;
    if (entity.type !== undefined) updates.type = entity.type;
    if (entity.parentOrgId !== undefined)
      updates.parentOrgId = entity.parentOrgId;
    if (entity.status !== undefined) updates.status = entity.status;

    const response = await this.dbClient.models.Organization.update(updates);
    return this.toOrganization(response.data!);
  }

  async delete(id: string): Promise<void> {
    await this.dbClient.models.Organization.delete({ orgId: id });
  }

  async findByParentOrgId(parentOrgId: string): Promise<OrganizationEntity[]> {
    const response =
      await this.dbClient.models.Organization.listOrganizationByParentOrgId({
        parentOrgId,
      });
    return response.data.map((item) => this.toOrganization(item));
  }

  async findByName(name: string): Promise<OrganizationEntity[]> {
    const response =
      await this.dbClient.models.Organization.listOrganizationByName({ name });
    return response.data.map((item) => this.toOrganization(item));
  }

  /**
   * Helper method to create a new Organization with defaults
   */
  public create = async (
    name: string,
    type: OrganizationType,
    createdByAccountId: string,
    profileOwner: string,
    orgId: string = uuid(),
    parentOrgId?: string
  ): Promise<OrganizationEntity> => {
    return this.save({
      orgId,
      name,
      type,
      createdByAccountId,
      parentOrgId: parentOrgId ?? '',
      createdAt: new Date(),
      status: 'active',
      profileOwner,
    });
  };

  /**
   * Convert Amplify Organization entity to AWS Organization type
   */
  private toOrganization(data: any): OrganizationEntity {
    return {
      orgId: data.orgId,
      name: data.name,
      type: data.type,
      parentOrgId: data.parentOrgId,
      createdByAccountId: data.createdByAccountId,
      createdAt: new Date(data.createdAt),
      status: data.status,
      profileOwner: data.profileOwner,
    };
  }
}
