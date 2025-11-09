import { Budget } from '../models';
import { BaseRepository } from './BaseRepository';

/**
 * Budget repository interface
 */
export interface BudgetRepository extends BaseRepository<Budget> {
  /**
   * Find all budgets for an organization
   */
  findByOrganization(organizationId: string): Promise<Budget[]>;

  /**
   * Find active budgets for an organization
   */
  findActiveByOrganization(organizationId: string): Promise<Budget[]>;

  /**
   * Find budget by category
   */
  findByCategory(organizationId: string, category: string): Promise<Budget | null>;
}
