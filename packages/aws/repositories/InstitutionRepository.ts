import { InstitutionEntity } from '../models';
import { BaseRepository } from './BaseRepository';

/**
 * Institution repository interface
 */
export interface InstitutionRepository
  extends BaseRepository<InstitutionEntity> {
  /**
   * Find all institutions for an organization
   */
  findByOrganization(organizationId: string): Promise<InstitutionEntity[]>;

  /**
   * Find institution by external item ID
   */
  findByExternalItemId(externalItemId: string): Promise<InstitutionEntity | null>;

  /**
   * Find institutions by provider
   */
  findByProvider(
    organizationId: string,
    provider: string
  ): Promise<InstitutionEntity[]>;
}
