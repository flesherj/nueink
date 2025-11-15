import { Converter } from './Converter';
import { FinancialAccount } from '../models';
import { FinancialAccountEntity } from '@nueink/aws';

/**
 * Converter for FinancialAccount domain model and FinancialAccountEntity
 */
export class FinancialAccountConverter implements Converter<FinancialAccountEntity, FinancialAccount> {
  toEntity(domain: FinancialAccount): FinancialAccountEntity {
    console.log('[DEBUG] FinancialAccountConverter.toEntity() - Input domain:', JSON.stringify({
      ...domain,
      syncedAt: domain.syncedAt?.toISOString(),
      createdAt: domain.createdAt?.toISOString(),
      updatedAt: domain.updatedAt?.toISOString(),
    }, null, 2));

    const entity = {
      financialAccountId: domain.financialAccountId,
      institutionId: domain.institutionId,
      organizationId: domain.organizationId,
      provider: domain.provider,
      externalAccountId: domain.externalAccountId,
      name: domain.name,
      officialName: domain.officialName,
      mask: domain.mask,
      type: domain.type,
      currentBalance: domain.currentBalance,
      availableBalance: domain.availableBalance,
      currency: domain.currency,
      personId: domain.personId,
      status: domain.status,
      rawData: domain.rawData ? JSON.stringify(domain.rawData) : undefined,  // AWSJSON requires string
      syncedAt: domain.syncedAt?.toISOString(),
      createdAt: domain.createdAt?.toISOString(),
      updatedAt: domain.updatedAt?.toISOString(),
      profileOwner: domain.profileOwner,
    };

    console.log('[DEBUG] FinancialAccountConverter.toEntity() - Output entity:', JSON.stringify(entity, null, 2));

    return entity;
  }

  toDomain(entity: FinancialAccountEntity): FinancialAccount {
    return {
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
      rawData: entity.rawData ? JSON.parse(entity.rawData) : undefined,  // Parse AWSJSON string back to object
      syncedAt: entity.syncedAt ? new Date(entity.syncedAt) : undefined,
      createdAt: new Date(entity.createdAt),
      updatedAt: new Date(entity.updatedAt),
      profileOwner: entity.profileOwner!,
    };
  }
}
