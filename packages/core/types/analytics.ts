/**
 * Analytics data types for spending insights and visualizations
 */

/**
 * A single data point in the category spending timeline
 */
export interface CategoryTimelineDataPoint {
  /** The date of the transaction */
  date: Date;
  /** The amount allocated to this category from the transaction split */
  amount: number;
  /** Running total of spending in this category up to this point */
  cumulativeAmount: number;
  /** The transaction ID for reference */
  transactionId: string;
  /** The merchant name for context */
  merchantName?: string;
}

/**
 * Complete timeline data for a category's spending over a period
 */
export interface CategoryTimelineData {
  /** The category name */
  category: string;
  /** Chronological data points showing cumulative spending */
  dataPoints: CategoryTimelineDataPoint[];
  /** Index of the highlighted transaction in dataPoints array (-1 if not found) */
  highlightIndex: number;
  /** Total amount spent in this category during the period */
  totalSpent: number;
  /** Number of transactions (or transaction splits) in this category */
  transactionCount: number;
  /** Start date of the analysis period */
  periodStart: Date;
  /** End date of the analysis period */
  periodEnd: Date;
  /** Budget amount for this category (if exists) */
  budgetAmount?: number;
  /** Percentage of budget used (if budget exists) */
  budgetPercentage?: number;
}

/**
 * Spending summary for a category
 */
export interface CategorySpendingSummary {
  category: string;
  totalSpent: number;
  transactionCount: number;
  averageTransaction: number;
  percentageOfTotal: number;
}

/**
 * Date range for analytics queries
 */
export interface AnalyticsDateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Helper function to get the current month's date range
 */
export const getCurrentMonthRange = (): AnalyticsDateRange => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { startDate, endDate };
};

/**
 * Helper function to get a specific month's date range
 */
export const getMonthRange = (year: number, month: number): AnalyticsDateRange => {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { startDate, endDate };
};
