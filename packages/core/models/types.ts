/**
 * Shared types for domain models
 */

/**
 * Account status
 */
export type AccountStatus = 'active' | 'invited' | 'disabled';

/**
 * Organization type
 */
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

/**
 * Organization status
 */
export type OrganizationStatus = 'active' | 'inactive' | 'disabled';

/**
 * Membership role
 */
export type MembershipRole =
  | 'owner'
  | 'admin'
  | 'member'
  | 'parent'
  | 'child';

/**
 * Membership status
 */
export type MembershipStatus = 'active' | 'invited' | 'pending';

/**
 * Supported currencies (ISO 4217)
 */
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY';

/**
 * Financial data provider
 */
export type FinancialProvider = 'plaid' | 'ynab' | 'manual';

/**
 * Status for institutions
 */
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

/**
 * Financial account status
 */
export type FinancialAccountStatus = 'active' | 'inactive' | 'closed';

/**
 * Budget period
 */
export type BudgetPeriod = 'monthly' | 'weekly' | 'yearly';

/**
 * Budget status
 */
export type BudgetStatus = 'active' | 'inactive';

/**
 * Debt type
 */
export type DebtType = 'credit_card' | 'loan' | 'mortgage' | 'other';

/**
 * Debt status
 */
export type DebtStatus = 'active' | 'paid_off' | 'closed';
