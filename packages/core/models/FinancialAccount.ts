import { FinancialProvider, FinancialAccountType, FinancialAccountStatus, Currency } from './types';

/**
 * FinancialAccount domain model
 * Represents a bank account, credit card, loan, etc.
 *
 * Note: All monetary amounts are stored as integers in cents (or smallest currency unit).
 * Example: $10.50 is stored as 1050
 */
export interface FinancialAccount {
  financialAccountId: string;
  institutionId: string;
  organizationId: string;
  provider: FinancialProvider;
  externalAccountId?: string;      // Provider's account ID
  name: string;
  officialName?: string;
  mask?: string;                   // Last 4 digits
  type: FinancialAccountType;
  currentBalance?: number;         // In cents (1050 = $10.50)
  availableBalance?: number;       // In cents (1050 = $10.50)
  currency: Currency;
  personId?: string;               // For auto-assignment
  status: FinancialAccountStatus;
  createdAt: Date;
  updatedAt: Date;
  profileOwner: string;
}
