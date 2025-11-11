import { Repository } from './Repository';

/**
 * Account repository interface
 * @template T - The account entity type
 */
export interface AccountRepository<T> extends Repository<T> {
  /**
   * Find account by email
   */
  findByEmail(email: string): Promise<T | null>;

  /**
   * Find account by username
   */
  findByUsername(username: string): Promise<T | null>;
}
