import {
  FinancialAnalysis,
  CategorySpending,
  NeedsVsWants,
  Transaction,
  TransactionSplit,
} from '../models';
import { TransactionService } from './TransactionService';
import { TransactionSplitService } from './TransactionSplitService';

/**
 * Financial Analysis Service
 * Analyzes spending patterns and generates insights
 */
export class FinancialAnalysisService {
  constructor(
    private transactionService: TransactionService,
    private splitService: TransactionSplitService<any>
  ) {}

  /**
   * Analyze spending for an organization over a time period
   * @param organizationId Organization to analyze
   * @param accountId Account requesting analysis
   * @param profileOwner User requesting analysis
   * @param periodMonths Number of months to analyze (default: 3)
   * @returns Financial analysis with spending breakdown
   */
  public analyzeSpending = async (
    organizationId: string,
    accountId: string,
    profileOwner: string,
    periodMonths: number = 3
  ): Promise<FinancialAnalysis> => {
    // Calculate date range - setMonth handles year rollover automatically
    const periodEnd = new Date();
    const periodStart = new Date();

    // Subtract months - JavaScript automatically handles year changes
    // Example: Jan 2025 - 3 months = Oct 2024
    periodStart.setMonth(periodStart.getMonth() - periodMonths);

    // Fetch all transactions for the period
    const transactions = await this.fetchTransactionsForPeriod(
      organizationId,
      periodStart,
      periodEnd
    );

    // Fetch splits for all transactions
    const splits = await this.fetchSplitsForTransactions(
      transactions.map((t) => t.transactionId)
    );

    // Analyze spending by category using splits
    const spendingByCategory = this.analyzeByCategory(transactions, splits);

    // Calculate total spending (only negative amounts = expenses)
    const totalSpending = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Generate analysis
    const analysis: FinancialAnalysis = {
      analysisId: this.generateAnalysisId(),
      accountId,
      organizationId,
      periodStart,
      periodEnd,
      totalSpending,
      spendingByCategory,
      createdAt: new Date(),
      profileOwner,
    };

    return analysis;
  };

  /**
   * Analyze spending by category
   * Groups transaction splits by category and calculates totals
   */
  private analyzeByCategory = (
    transactions: Transaction[],
    splits: TransactionSplit[]
  ): CategorySpending[] => {
    // Filter to expense splits only (negative amounts)
    const expenseSplits = splits.filter((s) => s.amount < 0);

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

      // Count unique transactions for this category
      const uniqueTransactionIds = new Set(categorySplits.map((s) => s.transactionId));

      categorySpending.push({
        category,
        amount,
        percentage,
        transactionCount: uniqueTransactionIds.size,
      });
    }

    // Sort by amount descending
    categorySpending.sort((a, b) => b.amount - a.amount);

    return categorySpending;
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
      const periodTransactions = result.items.filter((t) => {
        const txDate = new Date(t.date);
        return txDate >= periodStart && txDate <= periodEnd;
      });

      allTransactions.push(...periodTransactions);

      cursor = result.nextCursor;
      hasMore = !!result.hasMore && !!cursor;

      // Safety: If transaction dates are outside period, we've gone far enough
      if (result.items.length > 0) {
        const oldestTx = result.items[result.items.length - 1];
        const oldestDate = new Date(oldestTx.date);
        if (oldestDate < periodStart) {
          // We've gone past the period start, stop fetching
          break;
        }
      }
    }

    return allTransactions;
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
      const monthlyAvg = top.amount / 3; // 3 months
      insights.push(
        `You spend an average of $${(monthlyAvg / 100).toFixed(2)}/month on ${top.category} (${top.percentage.toFixed(1)}% of spending)`
      );
    }

    // Insight 2: Number of categories
    if (analysis.spendingByCategory.length > 5) {
      insights.push(
        `Your spending is spread across ${analysis.spendingByCategory.length} categories`
      );
    }

    // Insight 3: Total spending
    const monthlyAvg = analysis.totalSpending / 3; // 3 months
    insights.push(
      `Total spending: $${(analysis.totalSpending / 100).toFixed(2)} over 3 months (avg $${(monthlyAvg / 100).toFixed(2)}/month)`
    );

    return insights;
  };
}
