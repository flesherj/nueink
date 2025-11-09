import { BudgetPeriod, BudgetStatus } from './types';

export type BudgetEntity = {
  budgetId: string;
  organizationId: string;
  category: string;
  amount: number; // Budgeted amount
  period: BudgetPeriod;
  startDate: Date; // Budget period start
  endDate: Date; // Budget period end
  spent?: number; // Auto-calculated spent amount
  remaining?: number; // Auto-calculated remaining
  status: BudgetStatus;
  createdAt: Date;
  updatedAt: Date;
  profileOwner?: string;
};
