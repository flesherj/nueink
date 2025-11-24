import {
  FinancialProvider,
  Currency,
  FinancialAccountType,
  FinancialAccountStatus,
} from './types';

/**
 * FinancialAccount AWS Entity
 *
 * Note: All monetary amounts are stored as integers in cents (or smallest currency unit).
 * Example: $10.50 is stored as 1050
 */
export type FinancialAccountEntity = {
  financialAccountId: string;
  institutionId: string;
  organizationId: string;
  provider: FinancialProvider;
  externalAccountId?: string; // Provider's account ID
  name: string;
  officialName?: string;
  mask?: string; // Last 4 digits
  type: FinancialAccountType;
  currentBalance?: number; // In cents (1050 = $10.50)
  availableBalance?: number; // In cents (1050 = $10.50)
  currency: Currency;
  personId?: string; // FK to Person (for auto-assignment)
  status: FinancialAccountStatus;

  // Debt-specific fields (for liability accounts)
  interestRate?: number; // APR as decimal (0.1599 = 15.99%)
  minimumPayment?: number; // Minimum monthly payment in cents
  dueDate?: number; // Day of month (1-31) payment is due

  rawData?: string; // Complete provider response as JSON string (AWSJSON type)
  syncedAt?: string; // Last sync timestamp from provider (ISO string)
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  profileOwner?: string;
};
