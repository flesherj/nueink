import { FinancialProvider, InstitutionStatus } from './types';

/**
 * Institution domain model
 * Represents a financial institution (bank, credit card company, etc.)
 */
export interface Institution {
  institutionId: string;
  organizationId: string;
  provider: FinancialProvider;
  externalId?: string;             // Provider's institution ID
  externalItemId?: string;         // Provider's item/connection ID
  name: string;
  logo?: string;
  status: InstitutionStatus;
  lastSyncedAt?: Date;
  createdAt: Date;
  profileOwner: string;
}
