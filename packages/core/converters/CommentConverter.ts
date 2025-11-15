import { Converter } from './Converter';
import { Comment } from '../models';
import { CommentEntity } from '@nueink/aws';

/**
 * Converter for Comment domain model and CommentEntity
 */
export class CommentConverter implements Converter<CommentEntity, Comment> {
  public toEntity = (domain: Comment): CommentEntity => {
    return {
      commentId: domain.commentId,
      transactionId: domain.transactionId,
      accountId: domain.accountId,
      organizationId: domain.organizationId,
      text: domain.text,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
      profileOwner: domain.profileOwner,
    };
  };

  public toDomain = (entity: CommentEntity): Comment => {
    return {
      commentId: entity.commentId,
      transactionId: entity.transactionId,
      accountId: entity.accountId,
      organizationId: entity.organizationId,
      text: entity.text,
      createdAt: new Date(entity.createdAt),
      updatedAt: new Date(entity.updatedAt),
      profileOwner: entity.profileOwner!,
    };
  };
}
