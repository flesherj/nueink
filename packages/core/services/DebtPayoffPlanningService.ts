import {
  FinancialAccount,
  FinancialAccountType,
  DebtPayoffPlan,
  Budget,
} from '../models';
import type { AIInterestRateEstimator } from '../providers';
import { DebtPayoffService } from './DebtPayoffService';
import { FinancialAccountService } from './FinancialAccountService';
import { BudgetService } from './BudgetService';

/**
 * Debt Payoff Planning Service
 * Orchestrates debt discovery, AI enrichment, and payoff plan generation
 *
 * This service layer abstracts the business logic from the controller,
 * handling the coordination between account fetching, AI estimation, and plan generation.
 */
export class DebtPayoffPlanningService {
  private payoffService: DebtPayoffService;

  constructor(
    private accountService: FinancialAccountService,
    private budgetService: BudgetService,
    private aiEstimator?: AIInterestRateEstimator
  ) {
    this.payoffService = new DebtPayoffService();
  }

  /**
   * Get debt accounts enriched with AI-estimated interest rates
   *
   * @param organizationId Organization to fetch debts for
   * @returns Enriched debt accounts with estimated rates and minimum payments
   */
  public getEnrichedDebtAccounts = async (
    organizationId: string
  ): Promise<FinancialAccount[]> => {
    // Fetch all financial accounts for the organization
    const result = await this.accountService.findByOrganization(organizationId);
    const accounts = result.items;

    if (accounts.length === 0) {
      return [];
    }

    // Use AI to enrich debt accounts if estimator available
    if (this.aiEstimator) {
      return await this.getDebtAccountsWithAI(accounts);
    }

    // Fall back to static estimation
    return this.getDebtAccounts(accounts);
  };

  /**
   * Generate debt payoff plans for an organization
   *
   * Automatically discovers debt accounts from synced financial accounts,
   * enriches them with AI-estimated interest rates and promotional periods,
   * and generates multiple payoff strategies (avalanche, snowball).
   *
   * Returns TWO sets of plans:
   * 1. Consumer debt only (credit cards, personal loans, auto loans, medical debt)
   * 2. Total debt including mortgages
   *
   * @param organizationId Organization to generate plans for
   * @param accountId Account requesting the plans
   * @param profileOwner User requesting the plans
   * @param monthlyPayment Optional total monthly payment (defaults to minimums + 10%)
   * @returns Array of debt payoff plans with different strategies and scopes
   * @throws Error if no financial accounts or debt accounts found
   */
  public generatePayoffPlans = async (
    organizationId: string,
    accountId: string,
    profileOwner: string,
    monthlyPayment?: number
  ): Promise<DebtPayoffPlan[]> => {
    // Get enriched debt accounts (with AI estimation if available)
    const enrichedDebtAccounts = await this.getEnrichedDebtAccounts(organizationId);

    if (enrichedDebtAccounts.length === 0) {
      throw new Error('No debt accounts found');
    }

    // Separate consumer debt from mortgages
    const consumerDebt = enrichedDebtAccounts.filter(
      (account) => account.type !== 'mortgage'
    );

    const plans: DebtPayoffPlan[] = [];

    // Generate consumer debt plans (primary focus)
    if (consumerDebt.length > 0) {
      // Scenario 1: Minimum payments only (current pace)
      const consumerPlansMinimum = this.payoffService.generatePayoffPlans(
        consumerDebt,
        organizationId,
        accountId,
        profileOwner,
        monthlyPayment
      );

      plans.push(
        ...consumerPlansMinimum.map((plan) => ({
          ...plan,
          scope: 'consumer' as const,
          optimized: false,
        }))
      );

      // Scenario 2: Budget optimized (use actual budget surplus if available)
      // This shows what's possible with budget optimization
      if (!monthlyPayment) {
        // Calculate total minimum payments
        const totalMinimums = consumerDebt.reduce(
          (sum, account) => sum + (account.minimumPayment || 0),
          0
        );

        // Try to get active budget for organization
        const activeBudget = await this.budgetService.findActiveBudget(organizationId);

        let optimizedPayment: number;

        if (activeBudget && activeBudget.surplus > 0) {
          // Use actual budget surplus for optimized payment
          // Payment = minimums + budget surplus
          optimizedPayment = Math.round(totalMinimums + activeBudget.surplus);
        } else {
          // Fall back to estimated optimized payment (2x minimums + 10%)
          // This provides motivation even without a budget
          optimizedPayment = Math.round(totalMinimums * 2.2);
        }

        const consumerPlansOptimized = this.payoffService.generatePayoffPlans(
          consumerDebt,
          organizationId,
          accountId,
          profileOwner,
          optimizedPayment
        );

        plans.push(
          ...consumerPlansOptimized.map((plan) => ({
            ...plan,
            scope: 'consumer' as const,
            optimized: true,
          }))
        );
      }
    }

    // Generate total debt plans (including mortgages)
    const totalPlans = this.payoffService.generatePayoffPlans(
      enrichedDebtAccounts,
      organizationId,
      accountId,
      profileOwner,
      monthlyPayment
    );

    // Mark these as total debt scope
    plans.push(
      ...totalPlans.map((plan) => ({
        ...plan,
        scope: 'all' as const,
      }))
    );

    return plans;
  };

  // ==================== Private Debt Estimation Methods ====================

  /**
   * Fallback interest rates by account type (as decimal)
   * Used when AI estimation is unavailable or fails
   */
  private static readonly FALLBACK_INTEREST_RATES: Record<string, number> = {
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
   */
  private estimateInterestRate = (account: FinancialAccount): number => {
    // If account already has rate, use it
    if (account.interestRate !== undefined && account.interestRate !== null) {
      return account.interestRate;
    }

    // Try to extract from rawData (Plaid might provide this)
    if (account.rawData && typeof account.rawData === 'object') {
      const raw = account.rawData as any;
      if (raw.aprs && Array.isArray(raw.aprs) && raw.aprs.length > 0) {
        return raw.aprs[0].apr_percentage / 100;
      }
      if (raw.apr_percentage) {
        return raw.apr_percentage / 100;
      }
    }

    // Fall back to typical rate for account type
    return DebtPayoffPlanningService.FALLBACK_INTEREST_RATES[account.type] || 0.1099;
  };

  /**
   * Estimate minimum payment for an account if not provided
   */
  private estimateMinimumPayment = (account: FinancialAccount): number => {
    // If account already has minimum payment, use it
    if (account.minimumPayment !== undefined && account.minimumPayment !== null) {
      return account.minimumPayment;
    }

    // Try to extract from rawData
    if (account.rawData && typeof account.rawData === 'object') {
      const raw = account.rawData as any;
      if (raw.minimum_payment) {
        return raw.minimum_payment;
      }
    }

    const balance = account.currentBalance || 0;

    // Estimate based on account type
    switch (account.type) {
      case 'credit_card':
        return Math.max(Math.round(balance * 0.02), 2500);

      case 'line_of_credit':
        const interestRate = this.estimateInterestRate(account);
        const monthlyInterestRate = interestRate / 12;
        return Math.round(balance * monthlyInterestRate);

      case 'mortgage':
      case 'auto_loan':
      case 'student_loan':
      case 'personal_loan':
        const rate = this.estimateInterestRate(account);
        const monthlyRate = rate / 12;
        const numPayments = 120; // 10 years
        if (monthlyRate === 0) {
          return Math.round(balance / numPayments);
        }
        return Math.round(
          (balance * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
            (Math.pow(1 + monthlyRate, numPayments) - 1)
        );

      case 'medical_debt':
        return Math.max(Math.round(balance * 0.01), 5000);

      default:
        return Math.max(Math.round(balance * 0.02), 2500);
    }
  };

  /**
   * Check if an account is a debt/liability account
   */
  private isDebtAccount = (account: FinancialAccount): boolean => {
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
   */
  private getDebtAccounts = (accounts: FinancialAccount[]): FinancialAccount[] => {
    return accounts
      .filter(this.isDebtAccount)
      .filter((account) => account.status === 'active')
      .filter((account) => {
        const balance = account.currentBalance || 0;
        // Credit cards and loans typically have NEGATIVE balances when you owe money (YNAB convention)
        // Keep accounts with non-zero balance (either negative debt or positive for some loan types)
        return Math.abs(balance) > 0;
      })
      .map((account) => {
        const balance = account.currentBalance || 0;
        // For debt accounts with negative balances, convert to positive for payoff calculations
        const debtBalance = balance < 0 ? Math.abs(balance) : balance;

        // Create updated account with positive balance for estimation functions
        const accountForEstimation = {
          ...account,
          currentBalance: debtBalance,
        };

        return {
          ...accountForEstimation,
          interestRate: this.estimateInterestRate(accountForEstimation),
          minimumPayment: this.estimateMinimumPayment(accountForEstimation),
        };
      });
  };

  /**
   * Get all debt accounts with AI-powered interest rate estimation
   */
  private getDebtAccountsWithAI = async (
    accounts: FinancialAccount[]
  ): Promise<FinancialAccount[]> => {
    const debtAccounts = accounts
      .filter(this.isDebtAccount)
      .filter((account) => account.status === 'active')
      .filter((account) => {
        const balance = account.currentBalance || 0;
        // Credit cards and loans typically have NEGATIVE balances when you owe money (YNAB convention)
        return Math.abs(balance) > 0;
      });

    if (debtAccounts.length === 0) {
      return [];
    }

    // Use AI batch estimation if available
    if (this.aiEstimator) {
      try {
        const estimates = await this.aiEstimator.estimateInterestRates(debtAccounts);

        return debtAccounts.map((account) => {
          const estimate = estimates.get(account.financialAccountId);
          const balance = account.currentBalance || 0;
          const debtBalance = balance < 0 ? Math.abs(balance) : balance;

          // Create updated account with positive balance for estimation functions
          const accountForEstimation = {
            ...account,
            currentBalance: debtBalance,
          };

          // Calculate promotional end date if promotional period detected
          let promotionalEndDate: Date | undefined;
          if (estimate?.hasPromotionalPeriod && estimate.promotionalMonths) {
            promotionalEndDate = new Date();
            promotionalEndDate.setMonth(promotionalEndDate.getMonth() + estimate.promotionalMonths);
          }

          return {
            ...accountForEstimation,
            interestRate: estimate?.estimatedRate || this.estimateInterestRate(accountForEstimation),
            minimumPayment: this.estimateMinimumPayment(accountForEstimation),
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
    return this.getDebtAccounts(accounts);
  };
}
