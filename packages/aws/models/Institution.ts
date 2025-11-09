import { FinancialProvider, InstitutionStatus } from './types';

export type InstitutionEntity = {
  institutionId: string;
  organizationId: string;
  provider: FinancialProvider;
  externalId?: string; // Provider's institution ID
  externalItemId?: string; // Provider's item/connection ID
  name: string;
  logo?: string;
  status: InstitutionStatus;
  lastSyncedAt?: Date;
  createdAt: Date;
  profileOwner?: string;
};
