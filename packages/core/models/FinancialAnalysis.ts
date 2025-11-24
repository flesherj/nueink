/**
 * Financial Analysis domain model
 * Represents an AI-powered analysis of spending patterns over a time period
 */

/**
 * Category spending breakdown
 */
export interface CategorySpending {
  category: string;
  amount: number;              // Total spent in period (cents)
  monthlyAverage: number;      // Average per month (cents)
  percentage: number;          // Percentage of total spending
  transactionCount: number;
  trend?: 'up' | 'down' | 'stable';  // Compared to previous period
}

/**
 * Spending classification breakdown
 */
export interface NeedsVsWants {
  needs: number;         // Essential spending (housing, utilities, groceries)
  requirements: number;  // Necessary spending (transportation, work expenses)
  wants: number;         // Discretionary spending (dining, entertainment)
}

/**
 * Spending habit detected by analysis
 */
export interface SpendingHabit {
  type: 'positive' | 'negative' | 'neutral';
  description: string;
  impact: number;        // Dollar impact in cents (positive = saving, negative = costing)
  recommendation?: string;
}

/**
 * Financial Analysis
 * Complete analysis of spending patterns for a time period
 */
export interface FinancialAnalysis {
  analysisId: string;
  accountId: string;
  organizationId: string;

  // Analysis period
  periodStart: Date;
  periodEnd: Date;
  monthsAnalyzed: number;  // Actual months of data analyzed

  // Spending breakdown
  totalSpending: number;          // Total spent in period (cents)
  monthlyAverageSpending: number; // Average per month (cents)
  spendingByCategory: CategorySpending[];

  // Income breakdown
  totalIncome: number;            // Total income in period (cents)
  monthlyAverageIncome: number;   // Average income per month (cents)

  // Surplus calculation
  surplus: number;                // Total income - Total spending (cents)
  monthlySurplus: number;         // Average monthly income - Average monthly spending (cents)

  // Needs vs Wants classification (optional - requires AI)
  needsVsWants?: NeedsVsWants;

  // Detected habits (optional - requires AI)
  habits?: SpendingHabit[];

  // Financial health score (optional - requires AI)
  healthScore?: number;  // 0-100

  // AI-generated insights (optional - requires AI)
  aiInsights?: string[];

  // Metadata
  createdAt: Date;
  profileOwner: string;
}
