import { Converter } from './Converter';
import { Membership } from '../models';
import { MembershipEntity } from '@nueink/aws';

/**
 * Converter for Membership domain model and MembershipEntity
 */
export class MembershipConverter implements Converter<MembershipEntity, Membership> {
  public toEntity = (domain: Membership): MembershipEntity => {
    return {
      accountId: domain.accountId,
      orgId: domain.orgId,
      role: domain.role,
      status: domain.status,
      joinedAt: domain.joinedAt.toISOString(),
      profileOwner: domain.profileOwner,
    };
  };

  public toDomain = (entity: MembershipEntity): Membership => {
    return {
      accountId: entity.accountId,
      orgId: entity.orgId,
      role: entity.role,
      status: entity.status,
      joinedAt: new Date(entity.joinedAt),
      profileOwner: entity.profileOwner!,
    };
  };
}
