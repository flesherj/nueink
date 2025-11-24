import { Debt } from './Debt';

/**
 * Debt payoff strategy type
 */
export type PayoffStrategy = 'avalanche' | 'snowball' | 'custom';

/**
 * Monthly payment allocation for a single debt
 */
export interface DebtPayment {
  debtId: string;
  debtName: string;
  payment: number;           // Amount to pay this month (in cents)
  principal: number;         // Amount going to principal
  interest: number;          // Amount going to interest
  remainingBalance: number;  // Balance after this payment
}

/**
 * Payment schedule for a single month
 */
export interface MonthlyPaymentSchedule {
  month: number;             // Month number (1-based)
  date: Date;                // Date of payment
  totalPayment: number;      // Total payment across all debts
  payments: DebtPayment[];   // Individual debt payments
  debtsRemaining: number;    // Number of active debts after this payment
}

/**
 * Summary of payoff plan results
 */
export interface PayoffPlanSummary {
  totalDebt: number;              // Total current debt amount
  totalInterest: number;          // Total interest to be paid
  totalPaid: number;              // Total amount to be paid (debt + interest)
  monthsToPayoff: number;         // Number of months to complete
  monthlyPayment: number;         // Total monthly payment amount
  debtFreeDate: Date;             // Estimated debt-free date
}

/**
 * Debt Payoff Plan
 * Represents a strategy and timeline for paying off debts
 */
export interface DebtPayoffPlan {
  planId: string;
  organizationId: string;
  accountId: string;
  name: string;                   // e.g., "Avalanche Strategy", "Snowball Strategy"
  strategy: PayoffStrategy;

  // Debts included in plan
  debts: Debt[];

  // Payment configuration
  monthlyPayment: number;         // Total monthly payment across all debts
  extraPayment: number;           // Extra payment beyond minimums

  // Plan results
  summary: PayoffPlanSummary;
  schedule: MonthlyPaymentSchedule[];

  // Metadata
  createdAt: Date;
  profileOwner: string;
}

/**
 * Debt payoff plan options for generation
 */
export interface PayoffPlanOptions {
  strategy: PayoffStrategy;
  monthlyPayment?: number;        // Total monthly payment (if not provided, uses sum of minimums + extra)
  extraPayment?: number;          // Extra payment beyond minimums (default: 0)
  customOrder?: string[];         // Custom debt order (for custom strategy)
}
