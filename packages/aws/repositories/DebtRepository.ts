import { DebtEntity } from '../models';
import { BaseRepository } from './BaseRepository';

/**
 * Debt repository interface
 */
export interface DebtRepository extends BaseRepository<DebtEntity> {
  /**
   * Find all debts for an organization
   */
  findByOrganization(organizationId: string): Promise<DebtEntity[]>;

  /**
   * Find active debts for an organization
   */
  findActiveByOrganization(organizationId: string): Promise<DebtEntity[]>;

  /**
   * Find debt by linked financial account
   */
  findByFinancialAccount(financialAccountId: string): Promise<DebtEntity | null>;
}
