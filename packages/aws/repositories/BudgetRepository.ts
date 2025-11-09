import { BudgetEntity } from '../models';
import { BaseRepository } from './BaseRepository';

/**
 * Budget repository interface
 */
export interface BudgetRepository extends BaseRepository<BudgetEntity> {
  /**
   * Find all budgets for an organization
   */
  findByOrganization(organizationId: string): Promise<BudgetEntity[]>;

  /**
   * Find active budgets for an organization
   */
  findActiveByOrganization(organizationId: string): Promise<BudgetEntity[]>;

  /**
   * Find budget by category
   */
  findByCategory(
    organizationId: string,
    category: string
  ): Promise<BudgetEntity | null>;
}
