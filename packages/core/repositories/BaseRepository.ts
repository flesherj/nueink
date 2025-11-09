/**
 * Pagination result for cursor-based pagination
 */
export interface PaginationResult<T> {
  items: T[];
  nextCursor?: string;  // Opaque token for next page
  hasMore: boolean;
}

/**
 * Base repository interface
 * Provides common CRUD operations for all repositories
 */
export interface BaseRepository<T> {
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
