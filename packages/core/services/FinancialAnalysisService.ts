import {
  FinancialAnalysis,
  CategorySpending,
  NeedsVsWants,
  Transaction,
  TransactionSplit,
} from '../models';
import type { AIInsightProvider } from '../providers';
import { TransactionService } from './TransactionService';
import { TransactionSplitService } from './TransactionSplitService';

/**
 * Financial Analysis Service
 * Analyzes spending patterns and generates insights
 */
export class FinancialAnalysisService {
  constructor(
    private transactionService: TransactionService,
    private splitService: TransactionSplitService<any>,
    private aiInsightProvider: AIInsightProvider
  ) {}

  /**
   * Analyze spending for an organization over a time period
   * @param organizationId Organization to analyze
   * @param accountId Account requesting analysis
   * @param profileOwner User requesting analysis
   * @param periodMonths Number of months to analyze (default: 12, max: 12)
   * @returns Financial analysis with spending breakdown and monthly averages
   */
  public analyzeSpending = async (
    organizationId: string,
    accountId: string,
    profileOwner: string,
    periodMonths: number = 12
  ): Promise<FinancialAnalysis> => {
    // Cap at 12 months maximum for optimal financial planning
    // 12 months captures seasonal patterns and annual expenses
    const monthsToAnalyze = Math.min(periodMonths, 12);

    // Calculate date range - EXCLUDE current partial month, only analyze complete months
    // Set periodEnd to last day of previous month (11:59:59 PM)
    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Calculate periodStart - N complete months before periodEnd
    const periodStart = new Date(periodEnd);
    periodStart.setMonth(periodStart.getMonth() - monthsToAnalyze + 1); // +1 because we want N complete months
    periodStart.setDate(1); // First day of the start month
    periodStart.setHours(0, 0, 0, 0); // Start of day

    // Fetch all transactions for the period
    const transactions = await this.fetchTransactionsForPeriod(
      organizationId,
      periodStart,
      periodEnd
    );

    // Calculate actual months analyzed based on transaction data
    // This handles cases where we have less data than requested
    const actualMonthsAnalyzed = this.calculateActualMonths(
      transactions,
      periodStart,
      periodEnd
    );

    // Fetch splits for all transactions
    const splits = await this.fetchSplitsForTransactions(
      transactions.map((t) => t.transactionId)
    );

    // Analyze spending by category using splits
    const spendingByCategory = this.analyzeByCategory(
      transactions,
      splits,
      actualMonthsAnalyzed
    );

    // Calculate total spending from filtered categories
    // This ensures total matches the filtered expense splits
    const totalSpending = spendingByCategory.reduce(
      (sum, cat) => sum + cat.amount,
      0
    );

    // Calculate monthly average spending
    const monthlyAverageSpending =
      actualMonthsAnalyzed > 0 ? Math.round(totalSpending / actualMonthsAnalyzed) : 0;

    // Analyze income using splits
    const totalIncome = this.analyzeIncome(splits);

    // Calculate monthly average income
    const monthlyAverageIncome =
      actualMonthsAnalyzed > 0 ? Math.round(totalIncome / actualMonthsAnalyzed) : 0;

    // Calculate surplus (income - spending)
    const surplus = totalIncome - totalSpending;
    const monthlySurplus = monthlyAverageIncome - monthlyAverageSpending;

    // Generate analysis
    const analysis: FinancialAnalysis = {
      analysisId: this.generateAnalysisId(),
      accountId,
      organizationId,
      periodStart,
      periodEnd,
      monthsAnalyzed: actualMonthsAnalyzed,
      totalSpending,
      monthlyAverageSpending,
      spendingByCategory,
      totalIncome,
      monthlyAverageIncome,
      surplus,
      monthlySurplus,
      createdAt: new Date(),
      profileOwner,
    };

    return analysis;
  };

  /**
   * Analyze spending by category
   * Groups transaction splits by category and calculates totals and monthly averages
   */
  private analyzeByCategory = (
    transactions: Transaction[],
    splits: TransactionSplit[],
    monthsAnalyzed: number
  ): CategorySpending[] => {
    // Filter to expense splits only (negative amounts)
    // Exclude transfers, inflows, income, internal transactions, and debt payments (not actual spending)
    const expenseSplits = splits.filter((s) => {
      if (s.amount >= 0) return false; // Only expenses

      const category = (s.category || '').toLowerCase();

      // Exclude income categories
      if (category.includes('income')) return false;
      if (category.includes('inflow')) return false;

      // Exclude transfers between accounts
      if (category.includes('transfer')) return false;

      // Exclude internal transactions (starting balance, reconciliations, etc.)
      if (category.includes('internal:')) return false;

      // Exclude debt payments (credit card payments, loan payments)
      if (category.includes('credit card payment')) return false;
      if (category.includes('loan payment')) return false;

      // Exclude internal movements
      if (category.includes('ready to assign')) return false;

      return true;
    });

    // Calculate total spending
    const totalSpending = expenseSplits.reduce(
      (sum, s) => sum + Math.abs(s.amount),
      0
    );

    // Group by category
    const categoryMap = new Map<string, TransactionSplit[]>();
    for (const split of expenseSplits) {
      const category = split.category || 'Uncategorized';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(split);
    }

    // Calculate spending per category
    const categorySpending: CategorySpending[] = [];
    for (const [category, categorySplits] of categoryMap.entries()) {
      const amount = categorySplits.reduce((sum, s) => sum + Math.abs(s.amount), 0);
      const percentage = totalSpending > 0 ? (amount / totalSpending) * 100 : 0;

      // Calculate monthly average
      const monthlyAverage =
        monthsAnalyzed > 0 ? Math.round(amount / monthsAnalyzed) : amount;

      // Count unique transactions for this category
      const uniqueTransactionIds = new Set(categorySplits.map((s) => s.transactionId));

      categorySpending.push({
        category,
        amount,
        monthlyAverage,
        percentage,
        transactionCount: uniqueTransactionIds.size,
      });
    }

    // Sort by amount descending
    categorySpending.sort((a, b) => b.amount - a.amount);

    return categorySpending;
  };

  /**
   * Analyze income from transaction splits
   * Sums up all income category transactions
   */
  private analyzeIncome = (splits: TransactionSplit[]): number => {
    // Filter to income splits only (positive amounts in income categories)
    const incomeSplits = splits.filter((s) => {
      const category = (s.category || '').toLowerCase();

      // Include income categories
      if (category.includes('income')) return true;
      if (category.includes('inflow')) return true;

      return false;
    });

    // Calculate total income (sum of positive amounts)
    const totalIncome = incomeSplits.reduce(
      (sum, s) => sum + Math.abs(s.amount),
      0
    );

    return totalIncome;
  };

  /**
   * Fetch splits for transactions
   */
  private fetchSplitsForTransactions = async (
    transactionIds: string[]
  ): Promise<TransactionSplit[]> => {
    const allSplits: TransactionSplit[] = [];

    // Fetch splits for each transaction in parallel (batches of 10)
    const batchSize = 10;
    for (let i = 0; i < transactionIds.length; i += batchSize) {
      const batch = transactionIds.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((txId) => this.splitService.findByTransaction(txId))
      );
      allSplits.push(...batchResults.flat());
    }

    return allSplits;
  };

  /**
   * Fetch all transactions for a period
   * Handles pagination to get complete dataset
   */
  private fetchTransactionsForPeriod = async (
    organizationId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<Transaction[]> => {
    const allTransactions: Transaction[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    // Fetch all pages
    while (hasMore) {
      const result = await this.transactionService.findByOrganization(
        organizationId,
        100, // Fetch 100 at a time
        cursor
      );

      // Filter to transactions in period
      // Dates are already Date objects from the service layer converter
      const periodTransactions = result.items.filter((t) => {
        return t.date >= periodStart && t.date <= periodEnd;
      });

      allTransactions.push(...periodTransactions);

      cursor = result.nextCursor;
      hasMore = !!result.hasMore && !!cursor;

      // Safety: If transaction dates are outside period, we've gone far enough
      if (result.items.length > 0) {
        const oldestTx = result.items[result.items.length - 1];
        // Dates are already Date objects from the service layer converter
        if (oldestTx.date < periodStart) {
          // We've gone past the period start, stop fetching
          break;
        }
      }
    }

    return allTransactions;
  };

  /**
   * Calculate actual months of data analyzed
   * Uses transaction dates to determine real coverage
   * Falls back to requested period if no transactions
   */
  private calculateActualMonths = (
    transactions: Transaction[],
    periodStart: Date,
    periodEnd: Date
  ): number => {
    if (transactions.length === 0) {
      // No transactions - calculate months from requested period
      const months =
        (periodEnd.getFullYear() - periodStart.getFullYear()) * 12 +
        (periodEnd.getMonth() - periodStart.getMonth());
      return Math.max(1, months);
    }

    // Find earliest and latest transaction dates
    // Dates are already Date objects from the service layer converter
    const dates = transactions.map((t) => t.date);
    const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
    const latest = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Calculate months between earliest and latest transaction
    const months =
      (latest.getFullYear() - earliest.getFullYear()) * 12 +
      (latest.getMonth() - earliest.getMonth()) +
      1; // Add 1 to include both start and end months

    return Math.max(1, months);
  };

  /**
   * Generate unique analysis ID
   */
  private generateAnalysisId = (): string => {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * Get top spending categories
   * @param analysis Financial analysis
   * @param limit Number of top categories to return
   */
  public getTopCategories = (
    analysis: FinancialAnalysis,
    limit: number = 3
  ): CategorySpending[] => {
    return analysis.spendingByCategory.slice(0, limit);
  };

  /**
   * Generate AI-powered insights from analysis
   * @param analysis Financial analysis
   * @returns Promise of AI-generated insight strings
   */
  public generateAIInsights = async (
    analysis: FinancialAnalysis
  ): Promise<string[]> => {
    return this.aiInsightProvider.generateInsights(analysis);
  };

  /**
   * Get simple insights from analysis
   * @param analysis Financial analysis
   * @returns Array of insight strings
   */
  public getSimpleInsights = (analysis: FinancialAnalysis): string[] => {
    const insights: string[] = [];
    const topCategories = this.getTopCategories(analysis, 3);

    // Insight 1: Top spending category
    if (topCategories.length > 0) {
      const top = topCategories[0];
      insights.push(
        `You spend an average of $${(top.monthlyAverage / 100).toFixed(2)}/month on ${top.category} (${top.percentage.toFixed(1)}% of spending)`
      );
    }

    // Insight 2: Number of categories
    if (analysis.spendingByCategory.length > 5) {
      insights.push(
        `Your spending is spread across ${analysis.spendingByCategory.length} categories`
      );
    }

    // Insight 3: Total spending
    const monthsText = analysis.monthsAnalyzed === 1 ? 'month' : 'months';
    insights.push(
      `Total spending: $${(analysis.totalSpending / 100).toFixed(2)} over ${analysis.monthsAnalyzed} ${monthsText} (avg $${(analysis.monthlyAverageSpending / 100).toFixed(2)}/month)`
    );

    return insights;
  };
}
