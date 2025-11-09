import { FinancialAccount } from '../models';
import { BaseRepository, PaginationResult } from './BaseRepository';

/**
 * FinancialAccount repository interface
 */
export interface FinancialAccountRepository extends BaseRepository<FinancialAccount> {
  /**
   * Find all financial accounts for an organization (paginated)
   */
  findByOrganization(
    organizationId: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginationResult<FinancialAccount>>;

  /**
   * Find all financial accounts for an institution
   */
  findByInstitution(institutionId: string): Promise<FinancialAccount[]>;

  /**
   * Find financial account by external account ID
   */
  findByExternalAccountId(externalAccountId: string): Promise<FinancialAccount | null>;

  /**
   * Find all financial accounts assigned to a person
   */
  findByPerson(personId: string): Promise<FinancialAccount[]>;
}
