import { MembershipRepository } from '@nueink/core';
import type { AmplifyDataClient } from './types';
import { MembershipEntity, MembershipRole, MembershipStatus } from '../models';

export class AmplifyMembershipRepository
  implements MembershipRepository<MembershipEntity>
{
  constructor(private dbClient: AmplifyDataClient) {}

  async findById(id: string): Promise<MembershipEntity | null> {
    // Note: MembershipEntity uses composite key (accountId + orgId)
    // This method may need to be enhanced to handle composite keys
    throw new Error('findById not supported for Membership - use findByAccountAndOrganization');
  }

  async findAll(): Promise<MembershipEntity[]> {
    const response = await this.dbClient.models.Membership.list({});
    return response.data.map((item: any) => this.toMembership(item));
  }

  async save(entity: MembershipEntity): Promise<MembershipEntity> {
    const response = await this.dbClient.models.Membership.create({
      accountId: entity.accountId,
      orgId: entity.orgId,
      role: entity.role,
      status: entity.status,
      joinedAt: entity.joinedAt,
      profileOwner: entity.profileOwner,
    });

    if (!response.data) {
      throw new Error('Failed to create Membership: response.data is null');
    }
    return this.toMembership(response.data);
  }

  async update(id: string, entity: Partial<MembershipEntity>): Promise<MembershipEntity> {
    // Note: Update requires both accountId and orgId for composite key
    throw new Error('update not properly supported for Membership - requires composite key');
  }

  async delete(id: string): Promise<void> {
    // Note: Delete requires both accountId and orgId for composite key
    throw new Error('delete not properly supported for Membership - requires composite key');
  }

  async findByOrganization(orgId: string): Promise<MembershipEntity[]> {
    const response =
      await this.dbClient.models.Membership.listMembershipByOrgId({ orgId });
    return response.data.map((item: any) => this.toMembership(item));
  }

  async findByAccount(accountId: string): Promise<MembershipEntity[]> {
    // Note: This might not have a GSI - may need to scan or add index
    const allMemberships = await this.findAll();
    return allMemberships.filter((m: any) => m.accountId === accountId);
  }

  async findByAccountAndOrganization(
    accountId: string,
    orgId: string
  ): Promise<MembershipEntity | null> {
    const response = await this.dbClient.models.Membership.get({
      accountId,
      orgId,
    });
    if (!response.data) {
      return null;
    }
    return this.toMembership(response.data);
  }

  /**
   * Helper method to create a new Membership with defaults
   */
  public create = async (
    accountId: string,
    orgId: string,
    role: MembershipRole,
    profileOwner: string,
    status: MembershipStatus = 'active'
  ): Promise<MembershipEntity> => {
    return this.save({
      accountId,
      orgId,
      role,
      status,
      joinedAt: new Date().toISOString(),
      profileOwner,
    });
  };

  /**
   * Delete membership by composite key
   */
  public deleteByCompositeKey = async (
    accountId: string,
    orgId: string
  ): Promise<void> => {
    await this.dbClient.models.Membership.delete({ accountId, orgId });
  };

  /**
   * Update membership by composite key
   */
  public updateByCompositeKey = async (
    accountId: string,
    orgId: string,
    entity: Partial<MembershipEntity>
  ): Promise<MembershipEntity> => {
    const updates: any = { accountId, orgId };

    if (entity.role !== undefined) updates.role = entity.role;
    if (entity.status !== undefined) updates.status = entity.status;

    const response = await this.dbClient.models.Membership.update(updates);
    if (!response.data) {
      throw new Error('Failed to update Membership: response.data is null');
    }
    return this.toMembership(response.data);
  };

  /**
   * Convert Amplify Membership entity to AWS Membership type
   */
  private toMembership(data: any): MembershipEntity {
    return {
      accountId: data.accountId,
      orgId: data.orgId,
      role: data.role,
      status: data.status,
      joinedAt: data.joinedAt,
      profileOwner: data.profileOwner,
    };
  }
}
