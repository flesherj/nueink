import { CommentRepository, PaginationResult } from '@nueink/core';
import type { AmplifyDataClient } from './types';
import { CommentEntity } from '../models';

export class AmplifyCommentRepository
  implements CommentRepository<CommentEntity>
{
  constructor(private dbClient: AmplifyDataClient) {}

  public findById = async (id: string): Promise<CommentEntity | null> => {
    const response = await this.dbClient.models.Comment.get({ commentId: id });
    if (!response.data) {
      return null;
    }
    return this.toComment(response.data);
  };

  public findAll = async (): Promise<CommentEntity[]> => {
    const response = await this.dbClient.models.Comment.list({});
    return response.data.map((item: any) => this.toComment(item));
  };

  public save = async (entity: CommentEntity): Promise<CommentEntity> => {
    const response = await this.dbClient.models.Comment.create({
      commentId: entity.commentId,
      transactionId: entity.transactionId,
      accountId: entity.accountId,
      organizationId: entity.organizationId,
      text: entity.text,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      profileOwner: entity.profileOwner,
    });

    if (!response.data) {
      throw new Error('Failed to create Comment: response.data is null');
    }
    return this.toComment(response.data);
  };

  public update = async (id: string, entity: Partial<CommentEntity>): Promise<CommentEntity> => {
    const updates: any = { commentId: id };

    if (entity.text !== undefined) updates.text = entity.text;
    if (entity.updatedAt !== undefined)
      updates.updatedAt = entity.updatedAt;

    const response = await this.dbClient.models.Comment.update(updates);
    if (!response.data) {
      throw new Error('Failed to update Comment: response.data is null');
    }
    return this.toComment(response.data);
  };

  public delete = async (id: string): Promise<void> => {
    await this.dbClient.models.Comment.delete({ commentId: id });
  };

  public findByTransaction = async (transactionId: string): Promise<CommentEntity[]> => {
    const response =
      await this.dbClient.models.Comment.listCommentByTransactionIdAndCreatedAt({
        transactionId,
      });
    return response.data.map((item: any) => this.toComment(item));
  };

  public findByOrganization = async (
    organizationId: string,
    limit: number = 50,
    cursor?: string
  ): Promise<PaginationResult<CommentEntity>> => {
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
      items: response.data.map((item: any) => this.toComment(item)),
      nextCursor: response.nextToken ?? undefined,
      hasMore: !!response.nextToken,
    };
  };

  public findByAccount = async (accountId: string): Promise<CommentEntity[]> => {
    // Note: This requires filtering - fetch all and filter client-side
    // For better performance, consider adding a GSI on accountId in the future
    const allComments = await this.findAll();
    return allComments.filter((comment: any) => comment.accountId === accountId);
  };

  /**
   * Convert Amplify Comment entity to CommentEntity
   */
  private toComment = (data: any): CommentEntity => {
    return {
      commentId: data.commentId,
      transactionId: data.transactionId,
      accountId: data.accountId,
      organizationId: data.organizationId,
      text: data.text,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      profileOwner: data.profileOwner ?? undefined,
    };
  };
}
