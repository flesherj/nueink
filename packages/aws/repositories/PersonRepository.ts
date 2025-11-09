import { PersonEntity } from '../models';
import { BaseRepository } from './BaseRepository';

/**
 * Person repository interface
 */
export interface PersonRepository extends BaseRepository<PersonEntity> {
  /**
   * Find all people for an organization
   */
  findByOrganization(organizationId: string): Promise<PersonEntity[]>;
}
