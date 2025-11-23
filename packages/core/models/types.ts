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
 * Supported financial data providers
 */
export const FINANCIAL_PROVIDERS = ['plaid', 'ynab', 'manual'] as const;

/**
 * Financial data provider (derived from FINANCIAL_PROVIDERS array)
 */
export type FinancialProvider = typeof FINANCIAL_PROVIDERS[number];

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
 * Budget status - tracks budget lifecycle and workflow stage
 *
 * Workflow: baseline → optimized → active → archived
 */
export type BudgetStatus =
  | 'baseline'    // Created from current spending (no optimizations yet)
  | 'optimized'   // Has AI-suggested optimizations applied
  | 'active'      // Currently being tracked/used (one per org)
  | 'archived';   // No longer active, kept for history/comparison

/**
 * Integration configuration status
 */
export type IntegrationConfigStatus = 'active' | 'disabled' | 'error' | 'expired';

/**
 * Debt type
 */
export type DebtType = 'credit_card' | 'loan' | 'mortgage' | 'other';

/**
 * Debt status
 */
export type DebtStatus = 'active' | 'paid_off' | 'closed';
