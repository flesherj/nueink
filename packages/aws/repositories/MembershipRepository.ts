import { MembershipEntity } from '../models';
import { BaseRepository } from './BaseRepository';

/**
 * Membership repository interface
 */
export interface MembershipRepository extends BaseRepository<MembershipEntity> {
  /**
   * Find memberships by organization ID
   */
  findByOrganization(orgId: string): Promise<MembershipEntity[]>;

  /**
   * Find memberships by account ID
   */
  findByAccount(accountId: string): Promise<MembershipEntity[]>;

  /**
   * Find membership by account and organization
   */
  findByAccountAndOrganization(
    accountId: string,
    orgId: string
  ): Promise<MembershipEntity | null>;
}
