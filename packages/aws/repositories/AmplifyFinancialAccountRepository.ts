import { FinancialAccountRepository, PaginationResult } from '@nueink/core';
import type { AmplifyDataClient } from './types';
import { FinancialAccountEntity } from '../models';

export class AmplifyFinancialAccountRepository
  implements FinancialAccountRepository<FinancialAccountEntity>
{
  constructor(private dbClient: AmplifyDataClient) {}

  public findById = async (id: string): Promise<FinancialAccountEntity | null> => {
    const response = await this.dbClient.models.FinancialAccount.get({
      financialAccountId: id,
    });
    if (!response.data) {
      return null;
    }
    return this.toFinancialAccount(response.data);
  };

  public findAll = async (): Promise<FinancialAccountEntity[]> => {
    const response = await this.dbClient.models.FinancialAccount.list({});
    return response.data.map((item: any) => this.toFinancialAccount(item));
  };

  public save = async (entity: FinancialAccountEntity): Promise<FinancialAccountEntity> => {
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
      rawData: entity.rawData,
      syncedAt: entity.syncedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      profileOwner: entity.profileOwner,
    });

    if (!response.data) {
      throw new Error('Failed to create FinancialAccount: response.data is null');
    }
    return this.toFinancialAccount(response.data);
  };

  public update = async (
    id: string,
    entity: Partial<FinancialAccountEntity>
  ): Promise<FinancialAccountEntity> => {
    console.log('[DEBUG] AmplifyFinancialAccountRepository.update() - Input entity:', JSON.stringify({
      id,
      entity,
    }, null, 2));

    const updates: any = { financialAccountId: id };

    // Only include defined, non-null values in the update
    if (entity.name !== undefined && entity.name !== null) updates.name = entity.name;
    if (entity.officialName !== undefined && entity.officialName !== null)
      updates.officialName = entity.officialName;
    if (entity.mask !== undefined && entity.mask !== null) updates.mask = entity.mask;
    if (entity.currentBalance !== undefined && entity.currentBalance !== null)
      updates.currentBalance = entity.currentBalance;
    if (entity.availableBalance !== undefined && entity.availableBalance !== null)
      updates.availableBalance = entity.availableBalance;
    if (entity.personId !== undefined && entity.personId !== null) updates.personId = entity.personId;
    if (entity.status !== undefined && entity.status !== null) updates.status = entity.status;
    if (entity.rawData !== undefined && entity.rawData !== null) updates.rawData = entity.rawData;
    if (entity.syncedAt !== undefined && entity.syncedAt !== null) updates.syncedAt = entity.syncedAt;
    if (entity.updatedAt !== undefined && entity.updatedAt !== null)
      updates.updatedAt = entity.updatedAt;

    console.log('[DEBUG] AmplifyFinancialAccountRepository.update() - Filtered updates object:', JSON.stringify(updates, null, 2));

    const response = await this.dbClient.models.FinancialAccount.update(updates);

    console.log('[DEBUG] AmplifyFinancialAccountRepository.update() - AppSync response:', JSON.stringify({
      hasData: !!response.data,
      data: response.data,
      errors: response.errors,
    }, null, 2));

    if (!response.data) {
      throw new Error('Failed to update FinancialAccount: response.data is null');
    }
    return this.toFinancialAccount(response.data);
  };

  public delete = async (id: string): Promise<void> => {
    await this.dbClient.models.FinancialAccount.delete({
      financialAccountId: id,
    });
  };

  public findByOrganization = async (
    organizationId: string,
    limit: number = 50,
    cursor?: string
  ): Promise<PaginationResult<FinancialAccountEntity>> => {
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
  };

  public findByInstitution = async (institutionId: string): Promise<FinancialAccountEntity[]> => {
    const response =
      await this.dbClient.models.FinancialAccount.listFinancialAccountByInstitutionId(
        {
          institutionId,
        }
      );
    return response.data.map((item: any) => this.toFinancialAccount(item));
  };

  public findByExternalAccountId = async (
    externalAccountId: string
  ): Promise<FinancialAccountEntity | null> => {
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
  };

  public findByPerson = async (personId: string): Promise<FinancialAccountEntity[]> => {
    // Note: This requires filtering - fetch all and filter client-side
    // For better performance, consider adding a GSI on personId in the future
    const allAccounts = await this.findAll();
    return allAccounts.filter((account: any) => account.personId === personId);
  };

  /**
   * Convert Amplify FinancialAccount entity to FinancialAccountEntity
   */
  private toFinancialAccount = (data: any): FinancialAccountEntity => {
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
      rawData: data.rawData ?? undefined,
      syncedAt: data.syncedAt ?? undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      profileOwner: data.profileOwner ?? undefined,
    };
  };
}
