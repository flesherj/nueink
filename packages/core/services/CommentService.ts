import { Comment } from '../models';
import { CommentConverter } from '../converters';
import { CommentRepository, PaginationResult } from '../repositories';
import { CommentEntity } from '@nueink/aws';

/**
 * Comment service - handles business logic for comment operations
 */
export class CommentService {
  private converter: CommentConverter;

  constructor(private repository: CommentRepository<CommentEntity>) {
    this.converter = new CommentConverter();
  }

  public findById = async (id: string): Promise<Comment | null> => {
    const entity = await this.repository.findById(id);
    return entity ? this.converter.toDomain(entity) : null;
  };

  public findAll = async (): Promise<Comment[]> => {
    const entities = await this.repository.findAll();
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public findByTransaction = async (transactionId: string): Promise<Comment[]> => {
    const entities = await this.repository.findByTransaction(transactionId);
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public findByOrganization = async (
    organizationId: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginationResult<Comment>> => {
    const result = await this.repository.findByOrganization(organizationId, limit, cursor);
    return {
      items: result.items.map((entity) => this.converter.toDomain(entity)),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  };

  public findByAccount = async (accountId: string): Promise<Comment[]> => {
    const entities = await this.repository.findByAccount(accountId);
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public create = async (comment: Comment): Promise<Comment> => {
    const entity = this.converter.toEntity(comment);
    const saved = await this.repository.save(entity);
    return this.converter.toDomain(saved);
  };

  public update = async (id: string, updates: Partial<Comment>): Promise<Comment> => {
    const entityUpdates = this.converter.toEntity(updates as Comment);
    const updated = await this.repository.update(id, entityUpdates);
    return this.converter.toDomain(updated);
  };

  public delete = async (id: string): Promise<void> => {
    await this.repository.delete(id);
  };
}
