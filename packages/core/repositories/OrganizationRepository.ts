import { Repository } from './Repository';

/**
 * Organization repository interface
 * @template T - The organization entity type
 */
export interface OrganizationRepository<T> extends Repository<T> {
  /**
   * Find organizations by parent organization ID
   */
  findByParentOrgId(parentOrgId: string): Promise<T[]>;

  /**
   * Find organizations by name
   */
  findByName(name: string): Promise<T[]>;
}
