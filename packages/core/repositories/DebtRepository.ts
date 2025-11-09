import { Debt } from '../models';
import { BaseRepository } from './BaseRepository';

/**
 * Debt repository interface
 */
export interface DebtRepository extends BaseRepository<Debt> {
  /**
   * Find all debts for an organization
   */
  findByOrganization(organizationId: string): Promise<Debt[]>;

  /**
   * Find active debts for an organization
   */
  findActiveByOrganization(organizationId: string): Promise<Debt[]>;

  /**
   * Find debt by linked financial account
   */
  findByFinancialAccount(financialAccountId: string): Promise<Debt | null>;
}
