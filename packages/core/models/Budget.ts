import { BudgetStatus } from './types';

/**
 * Category-level budget within a master budget
 */
export interface CategoryBudget {
  /** Category name (matches spending categories) */
  category: string;

  /** Budgeted amount for this category (in cents) */
  budgetAmount: number;

  /** Current/historical spending for comparison (in cents) */
  currentSpending?: number;

  /** Percentage of total budget */
  percentage: number;

  /** Spending trend if available */
  trend?: 'up' | 'down' | 'stable';

  /** Notes or optimization applied */
  notes?: string;
}

/**
 * Budget - User's complete spending plan
 *
 * Starts as baseline (current spending) and can be optimized with
 * AI suggestions and adjusted for goals.
 *
 * Design: One active budget per organization at a time.
 * Other budgets can exist for comparison/history (baseline, archived).
 */
export interface Budget {
  /** Unique budget identifier */
  budgetId: string;

  /** Account that owns this budget */
  accountId: string;

  /** Organization context */
  organizationId: string;

  /** User-friendly name */
  name: string;

  /** Budget period start date */
  periodStart: Date;

  /** Budget period end date */
  periodEnd: Date;

  /** Per-category budgets */
  categoryBudgets: CategoryBudget[];

  /** Total monthly budget (sum of all categories, in cents) */
  totalBudget: number;

  /** Monthly income (in cents) */
  monthlyIncome: number;

  /** Monthly surplus (income - total budget, in cents) */
  surplus: number;

  /** Available for extra debt payments (surplus - debt minimums, in cents) */
  availableForDebt?: number;

  /** Budget status/stage */
  status: BudgetStatus;

  /** When this budget was created */
  createdAt: Date;

  /** Last updated timestamp */
  updatedAt: Date;

  /** Owner for authorization */
  profileOwner: string;

  /** Source analysis ID if created from analysis */
  sourceAnalysisId?: string;
}
