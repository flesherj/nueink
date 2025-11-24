import {
  FinancialAccount,
  DebtPayoffPlan,
  PayoffPlanOptions,
  PayoffPlanSummary,
  MonthlyPaymentSchedule,
  DebtPayment,
} from '../models';
import { getDebtAccounts, estimateInterestRate, estimateMinimumPayment } from '../utils/debtEstimation';

/**
 * Debt Payoff Service
 * Generates debt payoff plans using different strategies
 */
export class DebtPayoffService {
  /**
   * Generate multiple payoff plans for comparison
   * Returns avalanche, snowball, and custom strategies
   *
   * Automatically filters to debt accounts and enriches with estimated rates/payments
   */
  public generatePayoffPlans = (
    accounts: FinancialAccount[],
    organizationId: string,
    accountId: string,
    profileOwner: string,
    monthlyPayment?: number
  ): DebtPayoffPlan[] => {
    // Filter to debt accounts and enrich with estimates
    const debtAccounts = getDebtAccounts(accounts);

    if (debtAccounts.length === 0) {
      return [];
    }

    // Calculate default monthly payment (sum of minimums + 10%)
    const totalMinimums = debtAccounts.reduce(
      (sum, account) => sum + estimateMinimumPayment(account),
      0
    );
    const defaultMonthlyPayment = monthlyPayment || Math.round(totalMinimums * 1.1);

    // Generate avalanche strategy (highest interest rate first)
    const avalanche = this.generatePlan(debtAccounts, organizationId, accountId, profileOwner, {
      strategy: 'avalanche',
      monthlyPayment: defaultMonthlyPayment,
    });

    // Generate snowball strategy (smallest balance first)
    const snowball = this.generatePlan(debtAccounts, organizationId, accountId, profileOwner, {
      strategy: 'snowball',
      monthlyPayment: defaultMonthlyPayment,
    });

    return [avalanche, snowball];
  };

  /**
   * Generate a single payoff plan with specified strategy
   */
  public generatePlan = (
    accounts: FinancialAccount[],
    organizationId: string,
    accountId: string,
    profileOwner: string,
    options: PayoffPlanOptions
  ): DebtPayoffPlan => {
    // Filter to debt accounts and enrich
    const debtAccounts = getDebtAccounts(accounts);

    if (debtAccounts.length === 0) {
      throw new Error('No active debt accounts to create payoff plan');
    }

    // Calculate monthly payment
    const totalMinimums = debtAccounts.reduce(
      (sum, account) => sum + estimateMinimumPayment(account),
      0
    );
    const monthlyPayment = options.monthlyPayment || totalMinimums;
    const extraPayment = options.extraPayment || monthlyPayment - totalMinimums;

    // Validate monthly payment
    if (monthlyPayment < totalMinimums) {
      throw new Error(
        `Monthly payment ($${(monthlyPayment / 100).toFixed(2)}) must be at least ` +
          `the sum of minimum payments ($${(totalMinimums / 100).toFixed(2)})`
      );
    }

    // Order debts based on strategy
    const orderedAccounts = this.orderDebtsByStrategy(
      debtAccounts,
      options.strategy,
      options.customOrder
    );

    // Calculate payment schedule
    const schedule = this.calculatePaymentSchedule(orderedAccounts, monthlyPayment);

    // Calculate summary
    const summary = this.calculateSummary(debtAccounts, schedule);

    // Generate plan name
    const name = this.generatePlanName(options.strategy);

    const plan: DebtPayoffPlan = {
      planId: this.generatePlanId(),
      organizationId,
      accountId,
      name,
      strategy: options.strategy,
      debts: debtAccounts,
      monthlyPayment,
      extraPayment,
      summary,
      schedule,
      createdAt: new Date(),
      profileOwner,
    };

    return plan;
  };

  /**
   * Order debt accounts based on payoff strategy
   */
  private orderDebtsByStrategy = (
    accounts: FinancialAccount[],
    strategy: string,
    customOrder?: string[]
  ): FinancialAccount[] => {
    switch (strategy) {
      case 'avalanche':
        // Highest interest rate first
        return [...accounts].sort((a, b) => {
          const rateA = estimateInterestRate(a);
          const rateB = estimateInterestRate(b);
          return rateB - rateA; // Descending order
        });

      case 'snowball':
        // Smallest balance first
        return [...accounts].sort((a, b) => {
          const balanceA = a.currentBalance || 0;
          const balanceB = b.currentBalance || 0;
          return balanceA - balanceB;
        });

      case 'custom':
        // Custom order specified by user
        if (!customOrder || customOrder.length === 0) {
          return accounts;
        }
        return [...accounts].sort((a, b) => {
          const indexA = customOrder.indexOf(a.financialAccountId);
          const indexB = customOrder.indexOf(b.financialAccountId);
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });

      default:
        return accounts;
    }
  };

  /**
   * Calculate payment schedule month by month
   */
  private calculatePaymentSchedule = (
    orderedAccounts: FinancialAccount[],
    monthlyPayment: number
  ): MonthlyPaymentSchedule[] => {
    const schedule: MonthlyPaymentSchedule[] = [];

    // Create working copy of accounts with balances and promotional info
    const workingAccounts = orderedAccounts.map((account) => ({
      account,
      balance: account.currentBalance || 0,
      minimumPayment: estimateMinimumPayment(account),
      interestRate: estimateInterestRate(account),
      promotionalRate: account.promotionalRate,
      promotionalEndDate: account.promotionalEndDate,
      deferredInterest: account.deferredInterest || false,
      accruedDeferredInterest: 0, // Track deferred interest during promo period
      initialBalance: account.currentBalance || 0, // For deferred interest calculation
    }));

    let month = 1;
    const now = new Date();

    // Continue until all debts are paid off (max 600 months = 50 years)
    while (workingAccounts.some((a) => a.balance > 0) && month <= 600) {
      const monthDate = new Date(now);
      monthDate.setMonth(monthDate.getMonth() + month);

      let remainingPayment = monthlyPayment;
      const payments: DebtPayment[] = [];

      // First, pay minimums on all debts
      for (const wa of workingAccounts) {
        if (wa.balance <= 0) continue;

        // Determine if in promotional period
        const inPromoPeriod = wa.promotionalEndDate && monthDate < wa.promotionalEndDate;
        const currentRate = inPromoPeriod && wa.promotionalRate !== undefined
          ? wa.promotionalRate
          : wa.interestRate;

        // Calculate interest for this month
        const monthlyInterestRate = currentRate / 12;
        let interestCharge = Math.round(wa.balance * monthlyInterestRate);

        // Track deferred interest during promotional period
        if (inPromoPeriod && wa.deferredInterest) {
          const deferredMonthlyRate = wa.interestRate / 12;
          const deferredInterest = Math.round(wa.balance * deferredMonthlyRate);
          wa.accruedDeferredInterest += deferredInterest;
        }

        // If promotional period just ended and deferred interest applies, add it now
        const wasInPromo = wa.promotionalEndDate &&
          new Date(monthDate.getTime() - 30 * 24 * 60 * 60 * 1000) < wa.promotionalEndDate;
        if (wasInPromo && !inPromoPeriod && wa.deferredInterest && wa.balance > 0) {
          // Add all accrued deferred interest to balance
          wa.balance += wa.accruedDeferredInterest;
          interestCharge += wa.accruedDeferredInterest;
          wa.accruedDeferredInterest = 0;
        }

        // Pay minimum or remaining balance (whichever is less)
        const payment = Math.min(wa.minimumPayment, wa.balance + interestCharge, remainingPayment);
        const interest = Math.min(interestCharge, payment);
        const principal = payment - interest;

        wa.balance = wa.balance + interestCharge - payment;
        remainingPayment -= payment;

        payments.push({
          debtId: wa.account.financialAccountId,
          debtName: wa.account.name,
          payment,
          principal,
          interest,
          remainingBalance: Math.max(0, wa.balance),
        });
      }

      // Apply extra payment to first non-zero debt (avalanche/snowball target)
      if (remainingPayment > 0) {
        const targetAccount = workingAccounts.find((a) => a.balance > 0);
        if (targetAccount) {
          const extraPayment = Math.min(remainingPayment, targetAccount.balance);
          targetAccount.balance -= extraPayment;

          // Update the payment record
          const paymentIndex = payments.findIndex(
            (p) => p.debtId === targetAccount.account.financialAccountId
          );
          if (paymentIndex >= 0) {
            payments[paymentIndex].payment += extraPayment;
            payments[paymentIndex].principal += extraPayment;
            payments[paymentIndex].remainingBalance = Math.max(0, targetAccount.balance);
          }
        }
      }

      const debtsRemaining = workingAccounts.filter((a) => a.balance > 0).length;

      schedule.push({
        month,
        date: monthDate,
        totalPayment: monthlyPayment,
        payments,
        debtsRemaining,
      });

      month++;
    }

    return schedule;
  };

  /**
   * Calculate plan summary from schedule
   */
  private calculateSummary = (
    accounts: FinancialAccount[],
    schedule: MonthlyPaymentSchedule[]
  ): PayoffPlanSummary => {
    const totalDebt = accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

    let totalInterest = 0;
    for (const month of schedule) {
      for (const payment of month.payments) {
        totalInterest += payment.interest;
      }
    }

    const totalPaid = totalDebt + totalInterest;
    const monthsToPayoff = schedule.length;
    const monthlyPayment = schedule.length > 0 ? schedule[0].totalPayment : 0;

    const debtFreeDate = schedule.length > 0
      ? schedule[schedule.length - 1].date
      : new Date();

    return {
      totalDebt,
      totalInterest,
      totalPaid,
      monthsToPayoff,
      monthlyPayment,
      debtFreeDate,
    };
  };

  /**
   * Generate plan name based on strategy
   */
  private generatePlanName = (strategy: string): string => {
    switch (strategy) {
      case 'avalanche':
        return 'Avalanche Strategy (Highest Interest First)';
      case 'snowball':
        return 'Snowball Strategy (Smallest Balance First)';
      case 'custom':
        return 'Custom Payoff Plan';
      default:
        return 'Debt Payoff Plan';
    }
  };

  /**
   * Generate unique plan ID
   */
  private generatePlanId = (): string => {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };
}
