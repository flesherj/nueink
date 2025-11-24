import { FinancialAccount } from '../models';

/**
 * Interest rate estimation result
 */
export interface InterestRateEstimate {
  estimatedRate: number;        // APR as decimal (0.1599 = 15.99%)
  confidence: 'high' | 'medium' | 'low';
  reasoning?: string;           // AI explanation of the estimate
  marketContext?: string;       // Current market conditions

  // Promotional period information (e.g., CareCredit, store cards)
  hasPromotionalPeriod?: boolean;     // True if account likely has a promotional rate
  promotionalRate?: number;           // Promotional APR (often 0 for interest-free)
  promotionalMonths?: number;         // Estimated duration of promotional period
  hasDeferredInterest?: boolean;      // True if unpaid balance accrues retroactive interest
}

/**
 * AI-powered interest rate estimator
 *
 * Estimates interest rates for debt accounts based on:
 * - Current market conditions
 * - Account type and characteristics
 * - Historical transaction patterns
 * - Account balance and credit utilization
 */
export interface AIInterestRateEstimator {
  /**
   * Estimate interest rate for a financial account
   *
   * @param account - The financial account to estimate for
   * @param currentDate - Current date for market context (defaults to now)
   * @returns Interest rate estimate with confidence and reasoning
   */
  estimateInterestRate(
    account: FinancialAccount,
    currentDate?: Date
  ): Promise<InterestRateEstimate>;

  /**
   * Estimate interest rates for multiple accounts in batch
   * More efficient than calling estimateInterestRate multiple times
   *
   * @param accounts - Accounts to estimate for
   * @param currentDate - Current date for market context
   * @returns Map of account ID to interest rate estimate
   */
  estimateInterestRates(
    accounts: FinancialAccount[],
    currentDate?: Date
  ): Promise<Map<string, InterestRateEstimate>>;
}
