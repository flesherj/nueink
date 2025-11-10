import { TransactionEntity } from '../models';
import { BaseRepository, PaginationResult } from './BaseRepository';

/**
 * Transaction repository interface
 */
export interface TransactionRepository
  extends BaseRepository<TransactionEntity> {
  /**
   * Find all transactions for an organization (paginated)
   */
  findByOrganization(
    organizationId: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginationResult<TransactionEntity>>;

  /**
   * Find all transactions for a financial account (paginated)
   */
  findByFinancialAccount(
    financialAccountId: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginationResult<TransactionEntity>>;

  /**
   * Find all transactions assigned to a person (paginated)
   */
  findByPerson(
    personId: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginationResult<TransactionEntity>>;

  /**
   * Find transactions by date range
   */
  findByDateRange(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<TransactionEntity[]>;

  /**
   * Find transaction by external transaction ID
   */
  findByExternalTransactionId(
    externalTransactionId: string
  ): Promise<TransactionEntity | null>;

  /**
   * Find recent transactions for organization (for feed, not paginated)
   */
  findRecent(organizationId: string, limit: number): Promise<TransactionEntity[]>;
}
