import { FinancialAccountRepository, PaginationResult } from '@nueink/core';
import type { AmplifyDataClient } from './types';
import { FinancialAccountEntity } from '../models';

export class AmplifyFinancialAccountRepository
  implements FinancialAccountRepository<FinancialAccountEntity>
{
  constructor(private dbClient: AmplifyDataClient) {}

  async findById(id: string): Promise<FinancialAccountEntity | null> {
    const response = await this.dbClient.models.FinancialAccount.get({
      financialAccountId: id,
    });
    if (!response.data) {
      return null;
    }
    return this.toFinancialAccount(response.data);
  }

  async findAll(): Promise<FinancialAccountEntity[]> {
    const response = await this.dbClient.models.FinancialAccount.list({});
    return response.data.map((item: any) => this.toFinancialAccount(item));
  }

  async save(entity: FinancialAccountEntity): Promise<FinancialAccountEntity> {
    const response = await this.dbClient.models.FinancialAccount.create({
      financialAccountId: entity.financialAccountId,
      institutionId: entity.institutionId,
      organizationId: entity.organizationId,
      provider: entity.provider,
      externalAccountId: entity.externalAccountId,
      name: entity.name,
      officialName: entity.officialName,
      mask: entity.mask,
      type: entity.type,
      currentBalance: entity.currentBalance,
      availableBalance: entity.availableBalance,
      currency: entity.currency,
      personId: entity.personId,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      profileOwner: entity.profileOwner,
    });

    if (!response.data) {
      throw new Error('Failed to create FinancialAccount: response.data is null');
    }
    return this.toFinancialAccount(response.data);
  }

  async update(
    id: string,
    entity: Partial<FinancialAccountEntity>
  ): Promise<FinancialAccountEntity> {
    const updates: any = { financialAccountId: id };

    if (entity.name !== undefined) updates.name = entity.name;
    if (entity.officialName !== undefined)
      updates.officialName = entity.officialName;
    if (entity.mask !== undefined) updates.mask = entity.mask;
    if (entity.currentBalance !== undefined)
      updates.currentBalance = entity.currentBalance;
    if (entity.availableBalance !== undefined)
      updates.availableBalance = entity.availableBalance;
    if (entity.personId !== undefined) updates.personId = entity.personId;
    if (entity.status !== undefined) updates.status = entity.status;
    if (entity.updatedAt !== undefined)
      updates.updatedAt = entity.updatedAt;

    const response = await this.dbClient.models.FinancialAccount.update(updates);
    if (!response.data) {
      throw new Error('Failed to update FinancialAccount: response.data is null');
    }
    return this.toFinancialAccount(response.data);
  }

  async delete(id: string): Promise<void> {
    await this.dbClient.models.FinancialAccount.delete({
      financialAccountId: id,
    });
  }

  async findByOrganization(
    organizationId: string,
    limit: number = 50,
    cursor?: string
  ): Promise<PaginationResult<FinancialAccountEntity>> {
    const response =
      await this.dbClient.models.FinancialAccount.listFinancialAccountByOrganizationId(
        {
          organizationId,
        },
        {
          limit,
          nextToken: cursor,
        }
      );

    return {
      items: response.data.map((item: any) => this.toFinancialAccount(item)),
      nextCursor: response.nextToken ?? undefined,
      hasMore: !!response.nextToken,
    };
  }

  async findByInstitution(institutionId: string): Promise<FinancialAccountEntity[]> {
    const response =
      await this.dbClient.models.FinancialAccount.listFinancialAccountByInstitutionId(
        {
          institutionId,
        }
      );
    return response.data.map((item: any) => this.toFinancialAccount(item));
  }

  async findByExternalAccountId(
    externalAccountId: string
  ): Promise<FinancialAccountEntity | null> {
    const response =
      await this.dbClient.models.FinancialAccount.listFinancialAccountByExternalAccountId(
        {
          externalAccountId,
        }
      );
    if (response.data.length === 0) {
      return null;
    }
    return this.toFinancialAccount(response.data[0]);
  }

  async findByPerson(personId: string): Promise<FinancialAccountEntity[]> {
    // Note: This requires filtering - fetch all and filter client-side
    // For better performance, consider adding a GSI on personId in the future
    const allAccounts = await this.findAll();
    return allAccounts.filter((account: any) => account.personId === personId);
  }

  /**
   * Convert Amplify FinancialAccount entity to FinancialAccountEntity
   */
  private toFinancialAccount(data: any): FinancialAccountEntity {
    return {
      financialAccountId: data.financialAccountId,
      institutionId: data.institutionId,
      organizationId: data.organizationId,
      provider: data.provider,
      externalAccountId: data.externalAccountId ?? undefined,
      name: data.name,
      officialName: data.officialName ?? undefined,
      mask: data.mask ?? undefined,
      type: data.type,
      currentBalance: data.currentBalance ?? undefined,
      availableBalance: data.availableBalance ?? undefined,
      currency: data.currency,
      personId: data.personId ?? undefined,
      status: data.status,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      profileOwner: data.profileOwner ?? undefined,
    };
  }
}
