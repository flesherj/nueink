import { Repository, PaginationResult } from './Repository';

/**
 * FinancialAccount repository interface
 * @template T - The financial account entity type
 */
export interface FinancialAccountRepository<T> extends Repository<T> {
  /**
   * Find all financial accounts for an organization (paginated)
   */
  findByOrganization(
    organizationId: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginationResult<T>>;

  /**
   * Find all financial accounts for an institution
   */
  findByInstitution(institutionId: string): Promise<T[]>;

  /**
   * Find financial account by external account ID
   */
  findByExternalAccountId(externalAccountId: string): Promise<T | null>;

  /**
   * Find all financial accounts assigned to a person
   */
  findByPerson(personId: string): Promise<T[]>;
}
