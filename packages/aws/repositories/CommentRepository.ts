import { CommentEntity } from '../models';
import { BaseRepository, PaginationResult } from './BaseRepository';

/**
 * Comment repository interface
 */
export interface CommentRepository extends BaseRepository<CommentEntity> {
  /**
   * Find all comments for a transaction
   */
  findByTransaction(transactionId: string): Promise<CommentEntity[]>;

  /**
   * Find all comments for an organization (paginated)
   */
  findByOrganization(
    organizationId: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginationResult<CommentEntity>>;

  /**
   * Find comments by account (who commented)
   */
  findByAccount(accountId: string): Promise<CommentEntity[]>;
}
