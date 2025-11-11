import { Repository } from './Repository';

/**
 * Institution repository interface
 * @template T - The institution entity type
 */
export interface InstitutionRepository<T> extends Repository<T> {
  /**
   * Find all institutions for an organization
   */
  findByOrganization(organizationId: string): Promise<T[]>;

  /**
   * Find institution by external item ID
   */
  findByExternalItemId(externalItemId: string): Promise<T | null>;

  /**
   * Find institutions by provider
   */
  findByProvider(organizationId: string, provider: string): Promise<T[]>;
}
