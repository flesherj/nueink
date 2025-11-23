import { Repository } from './Repository';

/**
 * Budget repository interface
 * @template T - The budget entity type
 */
export interface BudgetRepository<T> extends Repository<T> {
  /**
   * Find all budgets for an organization
   */
  findByOrganization(organizationId: string): Promise<T[]>;

  /**
   * Find active budget for an organization (one per organization)
   */
  findActiveByOrganization(organizationId: string): Promise<T | null>;

  /**
   * Find all budgets for an account
   */
  findByAccount(accountId: string): Promise<T[]>;

  /**
   * Find budgets by status for an organization
   */
  findByStatus(
    organizationId: string,
    status: 'baseline' | 'optimized' | 'active' | 'archived'
  ): Promise<T[]>;
}
