import { Comment } from '../models';
import { BaseRepository, PaginationResult } from './BaseRepository';

/**
 * Comment repository interface
 */
export interface CommentRepository extends BaseRepository<Comment> {
  /**
   * Find all comments for a transaction
   */
  findByTransaction(transactionId: string): Promise<Comment[]>;

  /**
   * Find all comments for an organization (paginated)
   */
  findByOrganization(
    organizationId: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginationResult<Comment>>;

  /**
   * Find comments by account (who commented)
   */
  findByAccount(accountId: string): Promise<Comment[]>;
}
