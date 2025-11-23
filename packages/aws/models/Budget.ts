import { BudgetStatus } from './types';

/**
 * Category budget entity (stored as JSON in categoryBudgets array)
 */
export type CategoryBudgetEntity = {
  category: string;
  budgetAmount: number;
  currentSpending?: number;
  percentage: number;
  trend?: 'up' | 'down' | 'stable';
  notes?: string;
};

/**
 * Budget entity - DynamoDB/AppSync representation
 */
export type BudgetEntity = {
  budgetId: string;
  accountId: string;
  organizationId: string;
  name: string;
  periodStart: string; // ISO date string
  periodEnd: string; // ISO date string
  categoryBudgets: CategoryBudgetEntity[]; // DynamoDB List of Maps
  totalBudget: number;
  status: BudgetStatus;
  createdAt: string;
  updatedAt: string;
  profileOwner: string;
  sourceAnalysisId?: string;
};
