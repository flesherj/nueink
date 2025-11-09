import { Institution } from '../models';
import { BaseRepository } from './BaseRepository';

/**
 * Institution repository interface
 */
export interface InstitutionRepository extends BaseRepository<Institution> {
  /**
   * Find all institutions for an organization
   */
  findByOrganization(organizationId: string): Promise<Institution[]>;

  /**
   * Find institution by external item ID
   */
  findByExternalItemId(externalItemId: string): Promise<Institution | null>;

  /**
   * Find institutions by provider
   */
  findByProvider(organizationId: string, provider: string): Promise<Institution[]>;
}
