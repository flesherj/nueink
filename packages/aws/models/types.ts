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

export type FinancialAccountType =
  | 'depository'
  | 'credit'
  | 'loan'
  | 'investment';

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

export type FinancialAccountStatus = 'active' | 'inactive' | 'closed';

export type BudgetPeriod = 'monthly' | 'weekly' | 'yearly';

export type BudgetStatus = 'active' | 'inactive';

export type DebtType = 'credit_card' | 'loan' | 'mortgage' | 'other';

export type DebtStatus = 'active' | 'paid_off' | 'closed';
