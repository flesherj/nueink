import { v4 as uuid } from 'uuid';
import { OrganizationRepository } from '@nueink/core';
import type { AmplifyDataClient } from './types';
import { OrganizationEntity, OrganizationType } from '../models';

export class AmplifyOrganizationRepository
  implements OrganizationRepository<OrganizationEntity>
{
  constructor(private dbClient: AmplifyDataClient) {}

  public findById = async (id: string): Promise<OrganizationEntity | null> => {
    const response = await this.dbClient.models.Organization.get({ orgId: id });
    if (!response.data) {
      return null;
    }
    return this.toOrganization(response.data);
  };

  public findAll = async (): Promise<OrganizationEntity[]> => {
    const response = await this.dbClient.models.Organization.list({});
    return response.data.map((item: any) => this.toOrganization(item));
  };

  public save = async (entity: OrganizationEntity): Promise<OrganizationEntity> => {
    const response = await this.dbClient.models.Organization.create({
      orgId: entity.orgId,
      name: entity.name,
      type: entity.type,
      parentOrgId: entity.parentOrgId,
      createdByAccountId: entity.createdByAccountId,
      createdAt: entity.createdAt,
      status: entity.status,
      profileOwner: entity.profileOwner,
    });

    if (!response.data) {
      throw new Error('Failed to create organization: response.data is null');
    }

    return this.toOrganization(response.data);
  };

  public update = async (
    id: string,
    entity: Partial<OrganizationEntity>
  ): Promise<OrganizationEntity> => {
    const updates: any = { orgId: id };

    if (entity.name !== undefined) updates.name = entity.name;
    if (entity.type !== undefined) updates.type = entity.type;
    if (entity.parentOrgId !== undefined)
      updates.parentOrgId = entity.parentOrgId;
    if (entity.status !== undefined) updates.status = entity.status;

    const response = await this.dbClient.models.Organization.update(updates);

    if (!response.data) {
      throw new Error('Failed to update organization: response.data is null');
    }

    return this.toOrganization(response.data);
  };

  public delete = async (id: string): Promise<void> => {
    await this.dbClient.models.Organization.delete({ orgId: id });
  };

  public findByParentOrgId = async (parentOrgId: string): Promise<OrganizationEntity[]> => {
    const response =
      await this.dbClient.models.Organization.listOrganizationByParentOrgId({
        parentOrgId,
      });
    return response.data.map((item: any) => this.toOrganization(item));
  };

  public findByName = async (name: string): Promise<OrganizationEntity[]> => {
    const response =
      await this.dbClient.models.Organization.listOrganizationByName({ name });
    return response.data.map((item: any) => this.toOrganization(item));
  };

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
      parentOrgId,
      createdAt: new Date().toISOString(),
      status: 'active',
      profileOwner,
    });
  };

  /**
   * Convert Amplify Organization entity to AWS Organization type
   */
  private toOrganization = (data: any): OrganizationEntity => {
    return {
      orgId: data.orgId,
      name: data.name,
      type: data.type,
      parentOrgId: data.parentOrgId,
      createdByAccountId: data.createdByAccountId,
      createdAt: data.createdAt,
      status: data.status,
      profileOwner: data.profileOwner,
    };
  };
}
