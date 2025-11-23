/**
 * AI Insight Provider Interface
 *
 * Platform-agnostic interface for generating financial insights using AI.
 * Core package defines the contract, infrastructure packages provide implementations.
 */

import type { FinancialAnalysis } from '../models';

/**
 * Provider interface for AI-powered financial insight generation
 */
export interface AIInsightProvider {
  /**
   * Generate personalized insights from financial analysis
   *
   * @param analysis - The financial analysis to generate insights from
   * @returns Array of insight strings (typically 3-5 insights)
   */
  generateInsights(analysis: FinancialAnalysis): Promise<string[]>;
}
