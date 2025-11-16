import { TransactionService } from './TransactionService';
import { TransactionSplitService } from './TransactionSplitService';
import {
  CategoryTimelineData,
  CategoryTimelineDataPoint,
  CategorySpendingSummary,
} from '../types/analytics';
import { Transaction } from '../models';

/**
 * AnalyticsService - Provides spending insights and analytics
 *
 * Composes TransactionService and TransactionSplitService to deliver
 * higher-level analytics features like spending timelines, category summaries,
 * and budget analysis.
 */
export class AnalyticsService {
  constructor(
    private transactionService: TransactionService,
    private splitService: TransactionSplitService<any>
  ) {}

  /**
   * Get category spending timeline showing cumulative spending over a period
   *
   * @param organizationId - The organization ID
   * @param category - The category to analyze
   * @param startDate - Start of the analysis period
   * @param endDate - End of the analysis period
   * @param highlightTransactionId - Optional transaction ID to highlight in the timeline
   * @param merchantName - Optional merchant name to filter transactions (case-insensitive partial match)
   * @returns Timeline data with cumulative spending and highlighted transaction position
   *
   * @example
   * ```typescript
   * // All merchants
   * const timeline = await analytics.getCategorySpendingTimeline(
   *   'org-123',
   *   'Groceries',
   *   new Date('2025-11-01'),
   *   new Date('2025-11-30'),
   *   'tx-current'
   * );
   *
   * // Specific merchant only
   * const wholefoods = await analytics.getCategorySpendingTimeline(
   *   'org-123',
   *   'Groceries',
   *   new Date('2025-11-01'),
   *   new Date('2025-11-30'),
   *   'tx-current',
   *   'Whole Foods'
   * );
   *
   * console.log(`Total spent: $${timeline.totalSpent / 100}`);
   * console.log(`Transaction #${timeline.highlightIndex + 1} of ${timeline.transactionCount}`);
   * ```
   */
  public getCategorySpendingTimeline = async (
    organizationId: string,
    category: string,
    startDate: Date,
    endDate: Date,
    highlightTransactionId?: string,
    merchantName?: string
  ): Promise<CategoryTimelineData> => {
    // Get all splits for this category in the period
    // Note: We'll fetch all with pagination if needed
    const splitsResult = await this.splitService.findByOrganizationAndCategory(
      organizationId,
      category,
      1000 // Fetch up to 1000 splits (should be enough for a month)
    );

    const splits = splitsResult.items;

    // Fetch all transactions for these splits
    const transactionIds = [...new Set(splits.map(s => s.transactionId))];
    const transactions = await Promise.all(
      transactionIds.map(id => this.transactionService.findById(id))
    );

    // Create a map for quick transaction lookup
    const transactionMap = new Map<string, Transaction>();
    transactions.forEach(tx => {
      if (tx) transactionMap.set(tx.transactionId, tx);
    });

    // Build data points: combine split amounts with transaction dates
    const dataPoints: CategoryTimelineDataPoint[] = [];
    for (const split of splits) {
      const transaction = transactionMap.get(split.transactionId);
      if (!transaction) continue;

      // Filter by date range
      const txDate = new Date(transaction.date);
      if (txDate < startDate || txDate > endDate) continue;

      // Filter by merchant if specified (case-insensitive partial match)
      if (merchantName) {
        const txMerchant = transaction.merchantName || transaction.name || '';
        if (!txMerchant.toLowerCase().includes(merchantName.toLowerCase())) {
          continue;
        }
      }

      dataPoints.push({
        date: txDate,
        amount: Math.abs(split.amount), // Use absolute value for spending
        cumulativeAmount: 0, // Will calculate below
        transactionId: transaction.transactionId,
        merchantName: transaction.merchantName || transaction.name,
      });
    }

    // Sort by date
    dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate cumulative amounts
    let cumulativeTotal = 0;
    dataPoints.forEach(point => {
      cumulativeTotal += point.amount;
      point.cumulativeAmount = cumulativeTotal;
    });

    // Find the highlight index
    const highlightIndex = highlightTransactionId
      ? dataPoints.findIndex(p => p.transactionId === highlightTransactionId)
      : -1;

    // Calculate total spent (sum of absolute values)
    const totalSpent = dataPoints.reduce((sum, p) => sum + p.amount, 0);

    return {
      category,
      dataPoints,
      highlightIndex,
      totalSpent,
      transactionCount: dataPoints.length,
      periodStart: startDate,
      periodEnd: endDate,
      // Budget fields can be added later when budget service is implemented
      budgetAmount: undefined,
      budgetPercentage: undefined,
    };
  };

  /**
   * Get spending summaries for all categories in a period
   *
   * @param organizationId - The organization ID
   * @param startDate - Start of the analysis period
   * @param endDate - End of the analysis period
   * @returns Array of category spending summaries
   */
  public getCategorySpendingSummaries = async (
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CategorySpendingSummary[]> => {
    // Get all transactions in the date range
    const transactions = await this.transactionService.findByDateRange(
      organizationId,
      startDate,
      endDate
    );

    // Get splits for each transaction
    const allSplits = await Promise.all(
      transactions.map(tx => this.splitService.findByTransaction(tx.transactionId))
    );

    // Flatten splits
    const splits = allSplits.flat();

    // Group by category
    const categoryMap = new Map<string, number[]>();
    splits.forEach(split => {
      const amounts = categoryMap.get(split.category) || [];
      amounts.push(Math.abs(split.amount));
      categoryMap.set(split.category, amounts);
    });

    // Calculate total spending across all categories
    const totalSpending = splits.reduce((sum, s) => sum + Math.abs(s.amount), 0);

    // Build summaries
    const summaries: CategorySpendingSummary[] = [];
    categoryMap.forEach((amounts, category) => {
      const totalSpent = amounts.reduce((sum, amt) => sum + amt, 0);
      const transactionCount = amounts.length;
      const averageTransaction = transactionCount > 0 ? totalSpent / transactionCount : 0;
      const percentageOfTotal = totalSpending > 0 ? (totalSpent / totalSpending) * 100 : 0;

      summaries.push({
        category,
        totalSpent,
        transactionCount,
        averageTransaction,
        percentageOfTotal,
      });
    });

    // Sort by total spent (descending)
    summaries.sort((a, b) => b.totalSpent - a.totalSpent);

    return summaries;
  };
}
