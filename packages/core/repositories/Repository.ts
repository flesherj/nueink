/**
 * Pagination result for cursor-based pagination
 */
export interface PaginationResult<T> {
  items: T[];
  nextCursor?: string; // Opaque token for next page (DynamoDB nextToken)
  hasMore: boolean;
}

/**
 * Base repository interface
 * Provides common CRUD operations for all repositories
 * @template T - The entity type (domain model or entity)
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
 * Repository interface for entities that support pagination
 * @template T - The entity type (domain model or entity)
 */
export interface PaginatedRepository<T> extends Repository<T> {
  /**
   * Find entities with pagination support
   */
  findPaginated(
    limit?: number,
    cursor?: string
  ): Promise<PaginationResult<T>>;
}
