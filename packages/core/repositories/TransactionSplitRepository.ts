import { Repository, PaginationResult } from './Repository';

/**
 * TransactionSplit repository interface
 * @template T - The transaction split entity type
 */
export interface TransactionSplitRepository<T> extends Repository<T> {
  /**
   * Find all splits for a transaction
   */
  findByTransaction(transactionId: string): Promise<T[]>;

  /**
   * Find all splits for an organization (paginated)
   * Used by AI categorization to identify uncategorized transactions
   */
  findByOrganization(
    organizationId: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginationResult<T>>;

  /**
   * Find all splits for an organization by category (paginated)
   * Useful for budget tracking and category-based spending analysis
   */
  findByOrganizationAndCategory(
    organizationId: string,
    category: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginationResult<T>>;

  /**
   * Find all splits by category across all organizations
   * Useful for category-based queries
   */
  findByCategory(category: string): Promise<T[]>;

  /**
   * Delete all splits for a transaction
   * Used when recreating splits (e.g., editing split amounts)
   */
  deleteByTransaction(transactionId: string): Promise<void>;
}
