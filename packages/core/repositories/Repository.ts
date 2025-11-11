/**
 * Pagination result for cursor-based pagination
 * Generic type works with any entity
 */
export interface PaginationResult<T> {
  items: T[];
  nextCursor?: string; // Opaque token for next page (e.g., DynamoDB nextToken)
  hasMore: boolean;
}

/**
 * Base repository interface with generic type
 * Provides common CRUD operations for all repositories
 *
 * @template T - The entity type (can be Amplify-generated or any other)
 */
export interface Repository<T> {
  /**
   * Find entity by ID
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find all entities
   */
  findAll(): Promise<T[]>;

  /**
   * Save a new entity
   */
  save(entity: T): Promise<T>;

  /**
   * Update an existing entity
   */
  update(id: string, entity: Partial<T>): Promise<T>;

  /**
   * Delete an entity by ID
   */
  delete(id: string): Promise<void>;
}

/**
 * Repository with pagination support
 * Extends base repository with paginated queries
 *
 * @template T - The entity type
 */
export interface PaginatedRepository<T> extends Repository<T> {
  /**
   * Find all entities with pagination
   */
  findAllPaginated(
    limit: number,
    cursor?: string
  ): Promise<PaginationResult<T>>;
}
