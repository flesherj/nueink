import { Converter } from './Converter';
import { Institution } from '../models';
import { InstitutionEntity } from '@nueink/aws';

/**
 * Converter for Institution domain model and InstitutionEntity
 */
export class InstitutionConverter implements Converter<InstitutionEntity, Institution> {
  public toEntity = (domain: Institution): InstitutionEntity => {
    return {
      institutionId: domain.institutionId,
      organizationId: domain.organizationId,
      provider: domain.provider,
      externalId: domain.externalId,
      externalItemId: domain.externalItemId,
      name: domain.name,
      logo: domain.logo,
      status: domain.status,
      lastSyncedAt: domain.lastSyncedAt?.toISOString(),
      createdAt: domain.createdAt.toISOString(),
      profileOwner: domain.profileOwner,
    };
  };

  public toDomain = (entity: InstitutionEntity): Institution => {
    return {
      institutionId: entity.institutionId,
      organizationId: entity.organizationId,
      provider: entity.provider,
      externalId: entity.externalId,
      externalItemId: entity.externalItemId,
      name: entity.name,
      logo: entity.logo,
      status: entity.status,
      lastSyncedAt: entity.lastSyncedAt ? new Date(entity.lastSyncedAt) : undefined,
      createdAt: new Date(entity.createdAt),
      profileOwner: entity.profileOwner!,
    };
  };
}
