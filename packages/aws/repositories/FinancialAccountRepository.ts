import { FinancialAccountEntity } from '../models';
import { BaseRepository, PaginationResult } from './BaseRepository';

/**
 * FinancialAccount repository interface
 */
export interface FinancialAccountRepository
  extends BaseRepository<FinancialAccountEntity> {
  /**
   * Find all financial accounts for an organization (paginated)
   */
  findByOrganization(
    organizationId: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginationResult<FinancialAccountEntity>>;

  /**
   * Find all financial accounts for an institution
   */
  findByInstitution(institutionId: string): Promise<FinancialAccountEntity[]>;

  /**
   * Find financial account by external account ID
   */
  findByExternalAccountId(
    externalAccountId: string
  ): Promise<FinancialAccountEntity | null>;

  /**
   * Find all financial accounts assigned to a person
   */
  findByPerson(personId: string): Promise<FinancialAccountEntity[]>;
}
