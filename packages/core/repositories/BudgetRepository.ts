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
   * Find active budgets for an organization
   */
  findActiveByOrganization(organizationId: string): Promise<T[]>;

  /**
   * Find budget by category
   */
  findByCategory(organizationId: string, category: string): Promise<T | null>;
}
