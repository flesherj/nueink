import { BudgetPeriod, BudgetStatus } from './types';

export type BudgetEntity = {
  budgetId: string;
  organizationId: string;
  category: string;
  amount: number; // Budgeted amount
  period: BudgetPeriod;
  startDate: string; // Budget period start
  endDate?: string; // Budget period end
  spent?: number; // Auto-calculated spent amount
  remaining?: number; // Auto-calculated remaining
  status: BudgetStatus;
  syncedAt?: string; // Last sync timestamp from provider
  createdAt: string;
  updatedAt: string;
  profileOwner?: string;
};
