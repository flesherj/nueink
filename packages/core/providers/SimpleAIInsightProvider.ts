/**
 * Simple AI Insight Provider
 *
 * Fallback implementation that generates basic insights without AI.
 * Used when AI service is not available or as a fallback on error.
 */

import type { FinancialAnalysis } from '../models';
import type { AIInsightProvider } from './AIInsightProvider';

/**
 * Simple implementation of AIInsightProvider that generates basic insights
 * without requiring AI infrastructure
 */
export class SimpleAIInsightProvider implements AIInsightProvider {
  public generateInsights = async (
    analysis: FinancialAnalysis
  ): Promise<string[]> => {
    const insights: string[] = [];
    const monthlyAvg = analysis.totalSpending / 3;
    const topCategory = analysis.spendingByCategory[0];

    if (topCategory) {
      const categoryMonthlyAvg = topCategory.amount / 3;
      insights.push(
        `You spend an average of $${(categoryMonthlyAvg / 100).toFixed(2)}/month on ${topCategory.category} (${topCategory.percentage.toFixed(1)}% of your spending)`
      );
    }

    if (analysis.spendingByCategory.length > 5) {
      insights.push(
        `Your spending is spread across ${analysis.spendingByCategory.length} categories`
      );
    }

    insights.push(
      `Total spending: $${(analysis.totalSpending / 100).toFixed(2)} over 3 months (avg $${(monthlyAvg / 100).toFixed(2)}/month)`
    );

    return insights;
  };
}
