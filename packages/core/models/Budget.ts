import { BudgetPeriod, BudgetStatus } from './types';

/**
 * Budget domain model
 * Represents a budget for a category
 */
export interface Budget {
  budgetId: string;
  organizationId: string;
  category: string;
  amount: number;
  period: BudgetPeriod;
  startDate: Date;
  endDate?: Date;  // Optional for recurring budgets
  spent?: number;                  // Auto-calculated
  remaining?: number;              // Auto-calculated
  status: BudgetStatus;
  syncedAt?: Date;                 // Last sync timestamp from provider
  createdAt: Date;
  updatedAt: Date;
  profileOwner: string;
}
