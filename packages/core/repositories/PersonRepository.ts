import { Repository } from './Repository';

/**
 * Person repository interface
 * @template T - The person entity type
 */
export interface PersonRepository<T> extends Repository<T> {
  /**
   * Find all people for an organization
   */
  findByOrganization(organizationId: string): Promise<T[]>;
}
