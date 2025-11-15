/**
 * Shared types for SDK API responses
 */

export type PaginationResult<T> = {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
};
