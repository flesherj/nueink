/**
 * Pagination result for cursor-based pagination
 */
export interface PaginationResult<TEntity> {
  items: TEntity[];
  nextCursor?: string; // Opaque token for next page (DynamoDB nextToken)
  hasMore: boolean;
}

/**
 * Base repository interface
 * Provides common CRUD operations for all repositories
 * @template TEntity - The Amplify-generated entity type
 */
export interface BaseRepository<TEntity> {
  /**
   * Find entity by ID
   */
  findById(id: string): Promise<TEntity | null>;

  /**
   * Find all entities
   */
  findAll(): Promise<TEntity[]>;

  /**
   * Save a new entity
   */
  save(entity: TEntity): Promise<TEntity>;

  /**
   * Update an existing entity
   */
  update(id: string, entity: Partial<TEntity>): Promise<TEntity>;

  /**
   * Delete an entity by ID
   */
  delete(id: string): Promise<void>;
}
