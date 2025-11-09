import {
  FinancialProvider,
  Currency,
  FinancialAccountType,
  FinancialAccountSubtype,
  FinancialAccountStatus,
} from './types';

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
  subtype?: FinancialAccountSubtype;
  currentBalance?: number;
  availableBalance?: number;
  currency: Currency;
  personId?: string; // FK to Person (for auto-assignment)
  status: FinancialAccountStatus;
  createdAt: string;
  updatedAt: string;
  profileOwner?: string;
};
