import { generateClient } from 'aws-amplify/data';
import { type Schema } from '../../../backend/data/resource';
import { CommentEntity } from '../models';
import { CommentRepository } from './CommentRepository';
import { PaginationResult } from './BaseRepository';

export class AmplifyCommentRepository implements CommentRepository {
  constructor(private dbClient = generateClient<Schema>()) {}

  async findById(id: string): Promise<CommentEntity | null> {
    const response = await this.dbClient.models.Comment.get({ commentId: id });
    if (!response.data) {
      return null;
    }
    return this.toComment(response.data);
  }

  async findAll(): Promise<CommentEntity[]> {
    const response = await this.dbClient.models.Comment.list();
    return response.data.map((item) => this.toComment(item));
  }

  async save(entity: CommentEntity): Promise<CommentEntity> {
    const response = await this.dbClient.models.Comment.create({
      commentId: entity.commentId,
      transactionId: entity.transactionId,
      accountId: entity.accountId,
      organizationId: entity.organizationId,
      text: entity.text,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      profileOwner: entity.profileOwner,
    });

    return this.toComment(response.data!);
  }

  async update(id: string, entity: Partial<CommentEntity>): Promise<CommentEntity> {
    const updates: any = { commentId: id };

    if (entity.text !== undefined) updates.text = entity.text;
    if (entity.updatedAt !== undefined)
      updates.updatedAt = entity.updatedAt.toISOString();

    const response = await this.dbClient.models.Comment.update(updates);
    return this.toComment(response.data!);
  }

  async delete(id: string): Promise<void> {
    await this.dbClient.models.Comment.delete({ commentId: id });
  }

  async findByTransaction(transactionId: string): Promise<CommentEntity[]> {
    const response =
      await this.dbClient.models.Comment.listCommentByTransactionIdAndCreatedAt({
        transactionId,
      });
    return response.data.map((item) => this.toComment(item));
  }

  async findByOrganization(
    organizationId: string,
    limit: number = 50,
    cursor?: string
  ): Promise<PaginationResult<CommentEntity>> {
    const response =
      await this.dbClient.models.Comment.listCommentByOrganizationIdAndCreatedAt(
        {
          organizationId,
        },
        {
          limit,
          nextToken: cursor,
        }
      );

    return {
      items: response.data.map((item) => this.toComment(item)),
      nextCursor: response.nextToken ?? undefined,
      hasMore: !!response.nextToken,
    };
  }

  async findByAccount(accountId: string): Promise<CommentEntity[]> {
    // Note: This requires filtering - fetch all and filter client-side
    // For better performance, consider adding a GSI on accountId in the future
    const allComments = await this.findAll();
    return allComments.filter((comment) => comment.accountId === accountId);
  }

  /**
   * Convert Amplify Comment entity to CommentEntity
   */
  private toComment(data: any): CommentEntity {
    return {
      commentId: data.commentId,
      transactionId: data.transactionId,
      accountId: data.accountId,
      organizationId: data.organizationId,
      text: data.text,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      profileOwner: data.profileOwner ?? undefined,
    };
  }
}
