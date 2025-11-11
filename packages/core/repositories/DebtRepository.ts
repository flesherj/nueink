import { Repository } from './Repository';

/**
 * Debt repository interface
 * @template T - The debt entity type
 */
export interface DebtRepository<T> extends Repository<T> {
  /**
   * Find all debts for an organization
   */
  findByOrganization(organizationId: string): Promise<T[]>;

  /**
   * Find active debts for an organization
   */
  findActiveByOrganization(organizationId: string): Promise<T[]>;

  /**
   * Find debt by linked financial account
   */
  findByFinancialAccount(financialAccountId: string): Promise<T | null>;
}
