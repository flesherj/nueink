import { Repository, PaginationResult } from './Repository';

/**
 * Transaction repository interface
 * @template T - The transaction entity type
 */
export interface TransactionRepository<T> extends Repository<T> {
  /**
   * Find all transactions for an organization (paginated)
   */
  findByOrganization(
    organizationId: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginationResult<T>>;

  /**
   * Find all transactions for a financial account (paginated)
   */
  findByFinancialAccount(
    financialAccountId: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginationResult<T>>;

  /**
   * Find all transactions assigned to a person (paginated)
   */
  findByPerson(
    personId: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginationResult<T>>;

  /**
   * Find transactions by date range
   */
  findByDateRange(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<T[]>;

  /**
   * Find transaction by external transaction ID
   */
  findByExternalTransactionId(externalTransactionId: string): Promise<T | null>;

  /**
   * Find recent transactions for organization (for feed, not paginated)
   */
  findRecent(organizationId: string, limit: number): Promise<T[]>;
}
