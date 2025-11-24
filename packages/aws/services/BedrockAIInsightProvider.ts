/**
 * Bedrock AI Insight Provider
 *
 * AWS Bedrock implementation of AIInsightProvider interface.
 * Generates personalized financial insights using Claude via AWS Bedrock.
 */

import type { FinancialAnalysis, AIInsightProvider } from '@nueink/core';
import { BedrockService } from './BedrockService';

/**
 * AWS Bedrock implementation of AI insight generation
 */
export class BedrockAIInsightProvider implements AIInsightProvider {
  constructor(private bedrockService: BedrockService) {}

  /**
   * Generate insights from financial analysis
   */
  public generateInsights = async (
    analysis: FinancialAnalysis
  ): Promise<string[]> => {
    const prompt = this.buildInsightPrompt(analysis);

    try {
      const response = await this.bedrockService.invokeSimple(prompt, {
        modelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0', // Cross-region inference profile for better availability
        temperature: 0.7, // Higher for more creative insights
        maxTokens: 1000,
      });

      // Parse insights from response (expecting one insight per line)
      const insights = response
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .filter((line) => !line.startsWith('#')) // Remove markdown headers
        .map((line) => line.replace(/^[-*•]\s*/, '').trim()) // Remove bullet points
        .filter((line) => line.length > 10); // Filter out empty/short lines

      return insights.slice(0, 5); // Return top 5 insights
    } catch (error) {
      console.error('Error generating AI insights:', error);
      // Return fallback insights on error
      return this.getFallbackInsights(analysis);
    }
  };

  /**
   * Build prompt for Claude to generate insights
   */
  private buildInsightPrompt = (analysis: FinancialAnalysis): string => {
    const monthlyAvg = analysis.totalSpending / 3;
    const topCategories = analysis.spendingByCategory.slice(0, 5);

    const categoryBreakdown = topCategories
      .map((cat) => `- ${cat.category}: $${(cat.amount / 100).toFixed(2)} (${cat.percentage.toFixed(1)}%)`)
      .join('\n');

    return `You are a financial advisor analyzing spending patterns. Generate 3-5 concise, actionable insights about this person's spending.

Spending Analysis (Last 3 Months):
- Total Spending: $${(analysis.totalSpending / 100).toFixed(2)}
- Monthly Average: $${(monthlyAvg / 100).toFixed(2)}
- Number of Categories: ${analysis.spendingByCategory.length}

Top Spending Categories:
${categoryBreakdown}

Guidelines:
- Be conversational and helpful, not judgmental
- Focus on actionable insights and opportunities
- Identify patterns or unusual spending
- Suggest realistic optimizations
- Keep each insight to 1-2 sentences
- Don't use markdown or bullet points, just plain text
- Each insight should be on its own line

Generate insights now:`;
  };

  /**
   * Get fallback insights if AI fails
   */
  private getFallbackInsights = (analysis: FinancialAnalysis): string[] => {
    const insights: string[] = [];
    const monthlyAvg = analysis.totalSpending / 3;
    const topCategory = analysis.spendingByCategory[0];

    if (topCategory) {
      const categoryMonthlyAvg = topCategory.amount / 3;
      insights.push(
        `You spend an average of $${(categoryMonthlyAvg / 100).toFixed(2)}/month on ${topCategory.category} (${topCategory.percentage.toFixed(1)}% of your spending)`
      );
    }

    insights.push(
      `Your spending is spread across ${analysis.spendingByCategory.length} categories over the last 3 months`
    );

    insights.push(
      `Total spending: $${(analysis.totalSpending / 100).toFixed(2)} over 3 months (avg $${(monthlyAvg / 100).toFixed(2)}/month)`
    );

    return insights;
  };
}
