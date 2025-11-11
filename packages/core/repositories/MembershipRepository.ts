import { Repository } from './Repository';

/**
 * Membership repository interface
 * @template T - The membership entity type
 */
export interface MembershipRepository<T> extends Repository<T> {
  /**
   * Find memberships by organization ID
   */
  findByOrganization(orgId: string): Promise<T[]>;

  /**
   * Find memberships by account ID
   */
  findByAccount(accountId: string): Promise<T[]>;

  /**
   * Find membership by account and organization
   */
  findByAccountAndOrganization(
    accountId: string,
    orgId: string
  ): Promise<T | null>;
}
