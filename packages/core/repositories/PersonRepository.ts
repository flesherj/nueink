import { Person } from '../models';
import { BaseRepository } from './BaseRepository';

/**
 * Person repository interface
 */
export interface PersonRepository extends BaseRepository<Person> {
  /**
   * Find all people for an organization
   */
  findByOrganization(organizationId: string): Promise<Person[]>;
}
