import { TransactionSplit } from '../models';
import { TransactionSplitRepository, PaginationResult } from '../repositories';

/**
 * TransactionSplit service - handles business logic for transaction split operations
 *
 * Business Rules:
 * - Every transaction must have at least one split
 * - Sum of split amounts must equal transaction total
 * - Splits can be created, updated, or replaced as a set
 */
export class TransactionSplitService<TEntity> {
  constructor(private repository: TransactionSplitRepository<TEntity>) {}

  public findById = async (id: string): Promise<TransactionSplit | null> => {
    const entity = await this.repository.findById(id);
    return entity ? this.toDomain(entity) : null;
  };

  public findAll = async (): Promise<TransactionSplit[]> => {
    const entities = await this.repository.findAll();
    return entities.map((entity) => this.toDomain(entity));
  };

  public findByTransaction = async (transactionId: string): Promise<TransactionSplit[]> => {
    const entities = await this.repository.findByTransaction(transactionId);
    return entities.map((entity) => this.toDomain(entity));
  };

  public findByOrganizationAndCategory = async (
    organizationId: string,
    category: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginationResult<TransactionSplit>> => {
    const result = await this.repository.findByOrganizationAndCategory(
      organizationId,
      category,
      limit,
      cursor
    );
    return {
      items: result.items.map((entity) => this.toDomain(entity)),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  };

  public findByCategory = async (category: string): Promise<TransactionSplit[]> => {
    const entities = await this.repository.findByCategory(category);
    return entities.map((entity) => this.toDomain(entity));
  };

  public create = async (split: TransactionSplit): Promise<TransactionSplit> => {
    const entity = this.toEntity(split);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  };

  /**
   * Create multiple splits for a transaction
   * Validates that splits sum to transaction total
   */
  public createMany = async (
    splits: TransactionSplit[],
    transactionTotal: number
  ): Promise<TransactionSplit[]> => {
    // Validate splits sum to transaction total
    const splitsTotal = splits.reduce((sum, split) => sum + split.amount, 0);
    if (splitsTotal !== transactionTotal) {
      throw new Error(
        `Split amounts (${splitsTotal}) must equal transaction total (${transactionTotal})`
      );
    }

    // Create all splits
    const entities = splits.map((split) => this.toEntity(split));
    const savedEntities = await Promise.all(
      entities.map((entity) => this.repository.save(entity))
    );

    return savedEntities.map((entity) => this.toDomain(entity));
  };

  /**
   * Replace all splits for a transaction
   * Deletes existing splits and creates new ones
   */
  public replaceSplits = async (
    transactionId: string,
    newSplits: TransactionSplit[],
    transactionTotal: number
  ): Promise<TransactionSplit[]> => {
    // Delete existing splits
    await this.repository.deleteByTransaction(transactionId);

    // Create new splits with validation
    return this.createMany(newSplits, transactionTotal);
  };

  public update = async (
    id: string,
    updates: Partial<TransactionSplit>
  ): Promise<TransactionSplit> => {
    const entityUpdates = this.toEntity(updates as TransactionSplit);
    const updated = await this.repository.update(id, entityUpdates);
    return this.toDomain(updated);
  };

  public delete = async (id: string): Promise<void> => {
    await this.repository.delete(id);
  };

  public deleteByTransaction = async (transactionId: string): Promise<void> => {
    await this.repository.deleteByTransaction(transactionId);
  };

  /**
   * Create a default split for a transaction (100% of amount, single category)
   */
  public createDefaultSplit = async (
    transactionId: string,
    organizationId: string,
    profileOwner: string,
    amount: number,
    category: string = 'Uncategorized'
  ): Promise<TransactionSplit> => {
    const split: TransactionSplit = {
      splitId: this.generateId(),
      transactionId,
      organizationId,
      category,
      amount,
      percentage: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      profileOwner,
    };

    return this.create(split);
  };

  // Converter methods - to be implemented based on entity type
  private toDomain = (entity: TEntity): TransactionSplit => {
    // This will need to be implemented with actual converter logic
    // For now, cast as any to match the pattern
    return entity as any;
  };

  private toEntity = (domain: TransactionSplit): TEntity => {
    // This will need to be implemented with actual converter logic
    // For now, cast as any to match the pattern
    return domain as any;
  };

  private generateId = (): string => {
    // Simple ID generation - in production, use UUID or similar
    return `split_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };
}
