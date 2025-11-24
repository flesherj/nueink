import { FinancialAccount, FinancialAccountType } from '../models';
import { AIInterestRateEstimator } from '../providers';

/**
 * Fallback interest rates by account type (as decimal)
 * Used when AI estimation is unavailable or fails
 * These are static estimates and may be outdated
 */
const FALLBACK_INTEREST_RATES: Record<string, number> = {
  credit_card: 0.2099,        // 20.99% average credit card APR
  line_of_credit: 0.1249,     // 12.49% average line of credit
  mortgage: 0.0699,           // 6.99% average mortgage rate
  auto_loan: 0.0699,          // 6.99% average auto loan
  student_loan: 0.0549,       // 5.49% average student loan
  personal_loan: 0.1149,      // 11.49% average personal loan
  medical_debt: 0.0000,       // Typically 0% if payment plan
  liability: 0.0999,          // 9.99% default for unknown liability
};

/**
 * Estimate interest rate for an account if not provided
 * Returns typical rate for account type
 */
export const estimateInterestRate = (account: FinancialAccount): number => {
  // If account already has rate, use it
  if (account.interestRate !== undefined && account.interestRate !== null) {
    return account.interestRate;
  }

  // Try to extract from rawData (Plaid might provide this)
  if (account.rawData && typeof account.rawData === 'object') {
    const raw = account.rawData as any;
    if (raw.aprs && Array.isArray(raw.aprs) && raw.aprs.length > 0) {
      // Plaid provides APR in percentage (20.99), convert to decimal (0.2099)
      return raw.aprs[0].apr_percentage / 100;
    }
    if (raw.apr_percentage) {
      return raw.apr_percentage / 100;
    }
  }

  // Fall back to typical rate for account type
  return FALLBACK_INTEREST_RATES[account.type] || 0.1099; // 10.99% default
};

/**
 * Estimate interest rate using AI when available
 * Falls back to static estimates if AI is unavailable
 *
 * @param account - Account to estimate for
 * @param aiEstimator - Optional AI estimator (uses static fallback if not provided)
 * @returns Promise of estimated interest rate
 */
export const estimateInterestRateWithAI = async (
  account: FinancialAccount,
  aiEstimator?: AIInterestRateEstimator
): Promise<number> => {
  // If account already has rate, use it
  if (account.interestRate !== undefined && account.interestRate !== null) {
    return account.interestRate;
  }

  // Try AI estimation if available
  if (aiEstimator) {
    try {
      const estimate = await aiEstimator.estimateInterestRate(account);
      return estimate.estimatedRate;
    } catch (error) {
      console.warn('AI interest rate estimation failed, using fallback:', error);
    }
  }

  // Fall back to synchronous estimation
  return estimateInterestRate(account);
};

/**
 * Estimate minimum payment for an account if not provided
 * Uses typical minimums for different account types
 */
export const estimateMinimumPayment = (account: FinancialAccount): number => {
  // If account already has minimum payment, use it
  if (account.minimumPayment !== undefined && account.minimumPayment !== null) {
    return account.minimumPayment;
  }

  // Try to extract from rawData
  if (account.rawData && typeof account.rawData === 'object') {
    const raw = account.rawData as any;
    if (raw.minimum_payment) {
      // Assuming Plaid provides in cents
      return raw.minimum_payment;
    }
  }

  const balance = account.currentBalance || 0;

  // Estimate based on account type
  switch (account.type) {
    case 'credit_card':
      // Credit cards: greater of 1-3% of balance or $25
      const creditCardMin = Math.max(Math.round(balance * 0.02), 2500);
      return creditCardMin;

    case 'line_of_credit':
      // Lines of credit: typically interest-only
      const interestRate = estimateInterestRate(account);
      const monthlyInterestRate = interestRate / 12;
      return Math.round(balance * monthlyInterestRate);

    case 'mortgage':
    case 'auto_loan':
    case 'student_loan':
    case 'personal_loan':
      // Installment loans: estimate using 10-year amortization
      // This is rough - real minimum would be from loan terms
      const rate = estimateInterestRate(account);
      const monthlyRate = rate / 12;
      const numPayments = 120; // 10 years
      if (monthlyRate === 0) {
        return Math.round(balance / numPayments);
      }
      const payment = Math.round(
        (balance * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
          (Math.pow(1 + monthlyRate, numPayments) - 1)
      );
      return payment;

    case 'medical_debt':
      // Medical debt: typically flexible payment plans
      // Estimate 1% of balance or $50, whichever is greater
      return Math.max(Math.round(balance * 0.01), 5000);

    default:
      // Default: 2% of balance or $25
      return Math.max(Math.round(balance * 0.02), 2500);
  }
};

/**
 * Check if an account is a debt/liability account
 */
export const isDebtAccount = (account: FinancialAccount): boolean => {
  const debtTypes: FinancialAccountType[] = [
    'credit_card',
    'line_of_credit',
    'mortgage',
    'auto_loan',
    'student_loan',
    'personal_loan',
    'medical_debt',
    'liability',
  ];

  return debtTypes.includes(account.type);
};

/**
 * Get all debt accounts from a list of financial accounts
 * Enriches accounts with estimated interest rates and minimum payments
 * Uses static fallback estimates (synchronous)
 */
export const getDebtAccounts = (accounts: FinancialAccount[]): FinancialAccount[] => {
  return accounts
    .filter(isDebtAccount)
    .filter((account) => account.status === 'active')
    .filter((account) => (account.currentBalance || 0) > 0) // Only accounts with positive balances
    .map((account) => ({
      ...account,
      interestRate: estimateInterestRate(account),
      minimumPayment: estimateMinimumPayment(account),
    }));
};

/**
 * Get all debt accounts with AI-powered interest rate estimation
 * Enriches accounts with AI-estimated interest rates when available
 *
 * @param accounts - All financial accounts
 * @param aiEstimator - Optional AI estimator for interest rates
 * @returns Promise of enriched debt accounts
 */
export const getDebtAccountsWithAI = async (
  accounts: FinancialAccount[],
  aiEstimator?: AIInterestRateEstimator
): Promise<FinancialAccount[]> => {
  const debtAccounts = accounts
    .filter(isDebtAccount)
    .filter((account) => account.status === 'active')
    .filter((account) => (account.currentBalance || 0) > 0);

  if (debtAccounts.length === 0) {
    return [];
  }

  // Use AI batch estimation if available for better performance
  if (aiEstimator) {
    try {
      const estimates = await aiEstimator.estimateInterestRates(debtAccounts);

      return debtAccounts.map((account) => {
        const estimate = estimates.get(account.financialAccountId);

        // Calculate promotional end date if promotional period detected
        let promotionalEndDate: Date | undefined;
        if (estimate?.hasPromotionalPeriod && estimate.promotionalMonths) {
          promotionalEndDate = new Date();
          promotionalEndDate.setMonth(promotionalEndDate.getMonth() + estimate.promotionalMonths);
        }

        return {
          ...account,
          interestRate: estimate?.estimatedRate || estimateInterestRate(account),
          minimumPayment: estimateMinimumPayment(account),
          // Apply promotional period information from AI
          promotionalRate: estimate?.hasPromotionalPeriod ? estimate.promotionalRate : undefined,
          promotionalEndDate,
          deferredInterest: estimate?.hasDeferredInterest,
        };
      });
    } catch (error) {
      console.warn('AI batch estimation failed, using fallback:', error);
    }
  }

  // Fall back to synchronous estimation
  return getDebtAccounts(accounts);
};
