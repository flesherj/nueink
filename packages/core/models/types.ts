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
 */
export type FinancialAccountType = 'depository' | 'credit' | 'loan' | 'investment';

/**
 * Financial account subtypes
 */
export type FinancialAccountSubtype =
  | 'checking'
  | 'savings'
  | 'credit_card'
  | 'mortgage'
  | 'auto'
  | 'student'
  | 'personal'
  | 'commercial'
  | 'brokerage'
  | '401k'
  | 'ira'
  | 'roth';

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
