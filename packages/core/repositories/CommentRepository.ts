import { Repository, PaginationResult } from './Repository';

/**
 * Comment repository interface
 * @template T - The comment entity type
 */
export interface CommentRepository<T> extends Repository<T> {
  /**
   * Find all comments for a transaction
   */
  findByTransaction(transactionId: string): Promise<T[]>;

  /**
   * Find all comments for an organization (paginated)
   */
  findByOrganization(
    organizationId: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginationResult<T>>;

  /**
   * Find comments by account (who commented)
   */
  findByAccount(accountId: string): Promise<T[]>;
}
