/**
 * AWS entity type definitions
 * These are string literal union types for AWS entity statuses and categories
 */

// Account types
export type AccountStatus = 'active' | 'invited' | 'disabled';

// Organization types
export type OrganizationStatus = 'active' | 'inactive' | 'disabled';

export type OrganizationType =
  | 'individual'
  | 'family'
  | 'company'
  | 'enterprise'
  | 'government'
  | 'educational'
  | 'nonprofit'
  | 'partner'
  | 'sandbox';

// Membership types
export type MembershipRole =
  | 'owner'
  | 'admin'
  | 'member'
  | 'parent'
  | 'child';

export type MembershipStatus = 'active' | 'invited' | 'pending';

// Financial types
export type FinancialProvider = 'plaid' | 'ynab' | 'manual';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY';

export type InstitutionStatus = 'active' | 'disconnected' | 'error';

/**
 * Financial account types
 *
 * Granular account types that users understand.
 * No abstraction layers - we display exactly what the account is.
 */
export type FinancialAccountType =
  // Asset accounts (money you own)
  | 'checking'
  | 'savings'
  | 'cash'
  | 'brokerage'
  | '401k'
  | 'ira'
  | 'roth'
  | 'investment'
  | 'asset'
  // Liability accounts (money you owe)
  | 'credit_card'
  | 'line_of_credit'
  | 'mortgage'
  | 'auto_loan'
  | 'student_loan'
  | 'personal_loan'
  | 'medical_debt'
  | 'liability';

export type FinancialAccountStatus = 'active' | 'inactive' | 'closed';

export type BudgetPeriod = 'monthly' | 'weekly' | 'yearly';

export type BudgetStatus = 'active' | 'inactive';

export type DebtType = 'credit_card' | 'loan' | 'mortgage' | 'other';

export type DebtStatus = 'active' | 'paid_off' | 'closed';
