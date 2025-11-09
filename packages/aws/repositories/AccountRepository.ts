import { AccountEntity } from '../models';
import { BaseRepository } from './BaseRepository';

/**
 * Account repository interface
 */
export interface AccountRepository extends BaseRepository<AccountEntity> {
  /**
   * Find account by email
   */
  findByEmail(email: string): Promise<AccountEntity | null>;

  /**
   * Find account by username
   */
  findByUsername(username: string): Promise<AccountEntity | null>;
}
