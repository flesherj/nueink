import { FinancialProvider, FinancialAccountType, FinancialAccountStatus, Currency } from './types';

/**
 * FinancialAccount domain model
 * Represents a bank account, credit card, loan, etc.
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
  subtype?: string;
  currentBalance?: number;
  availableBalance?: number;
  currency: Currency;
  personId?: string;               // For auto-assignment
  status: FinancialAccountStatus;
  createdAt: Date;
  updatedAt: Date;
  profileOwner: string;
}
