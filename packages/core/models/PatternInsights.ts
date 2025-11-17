/**
 * Pattern Analysis Domain Models
 *
 * Represents insights discovered from transaction pattern analysis
 */

/**
 * Detected recurring transaction pattern
 */
export interface RecurringPattern {
  merchant: string;
  category: string;
  averageAmount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  occurrences: number;
  lastDate: Date;
  nextExpectedDate?: Date;
  confidence: number; // 0-100
}

/**
 * Category spending insight
 */
export interface CategoryInsight {
  category: string;
  totalSpent: number;
  transactionCount: number;
  averageAmount: number;
  monthlyAverage: number;
  percentOfTotal: number;
}

/**
 * Merchant spending insight
 */
export interface MerchantInsight {
  merchant: string;
  totalSpent: number;
  transactionCount: number;
  categories: string[];
  firstSeen: Date;
  lastSeen: Date;
}

/**
 * Monthly spending trend
 */
export interface TrendInsight {
  month: string; // YYYY-MM
  totalSpent: number;
  transactionCount: number;
  topCategory: string;
  change?: number; // % change from previous month
}

/**
 * Comprehensive pattern analysis result
 */
export interface PatternAnalysis {
  organizationId: string;
  analyzedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  totalTransactions: number;
  totalSpent: number;
  monthlyAverage: number;

  recurringPatterns: RecurringPattern[];
  categoryInsights: CategoryInsight[];
  merchantInsights: MerchantInsight[];
  monthlyTrends: TrendInsight[];

  // Summary metrics
  uniqueMerchants: number;
  categoriesUsed: number;
  largestExpense: {
    merchant: string;
    amount: number;
    date: Date;
  };
  averageTransactionSize: number;
}
