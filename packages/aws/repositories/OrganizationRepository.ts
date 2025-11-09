import { OrganizationEntity } from '../models';
import { BaseRepository } from './BaseRepository';

/**
 * Organization repository interface
 */
export interface OrganizationRepository
  extends BaseRepository<OrganizationEntity> {
  /**
   * Find organizations by parent organization ID
   */
  findByParentOrgId(parentOrgId: string): Promise<OrganizationEntity[]>;

  /**
   * Find organizations by name
   */
  findByName(name: string): Promise<OrganizationEntity[]>;
}
