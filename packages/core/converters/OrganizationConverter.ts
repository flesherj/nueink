import { Converter } from './Converter';
import { Organization } from '../models';
import { OrganizationEntity } from '@nueink/aws';

/**
 * Converter for Organization domain model and OrganizationEntity
 */
export class OrganizationConverter implements Converter<OrganizationEntity, Organization> {
  toEntity(domain: Organization): OrganizationEntity {
    return {
      orgId: domain.orgId,
      name: domain.name,
      type: domain.type,
      parentOrgId: domain.parentOrgId,
      createdByAccountId: domain.createdByAccountId,
      createdAt: domain.createdAt.toISOString(),
      status: domain.status,
      profileOwner: domain.profileOwner,
    };
  }

  toDomain(entity: OrganizationEntity): Organization {
    return {
      orgId: entity.orgId,
      name: entity.name,
      type: entity.type,
      parentOrgId: entity.parentOrgId,
      createdByAccountId: entity.createdByAccountId,
      createdAt: new Date(entity.createdAt),
      status: entity.status,
      profileOwner: entity.profileOwner!,
    };
  }
}
