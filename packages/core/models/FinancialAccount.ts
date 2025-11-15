import { FinancialProvider, FinancialAccountType, FinancialAccountStatus, Currency } from './types';

/**
 * FinancialAccount domain model
 * Represents a bank account, credit card, loan, etc.
 *
 * Note: All monetary amounts are stored as integers in cents (or smallest currency unit).
 * Example: $10.50 is stored as 1050
 *
 * This is the complete domain model representing the full business entity.
 * It includes both normalized fields (for business logic) and raw provider data
 * (for advanced features, debugging, and future-proofing).
 *
 * Note: When exposing to clients via API/GraphQL, transform to a View Model
 * that excludes rawData and includes only fields appropriate for that context.
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
  rawData?: Record<string, any>;   // Complete provider response (for debugging, backfill, advanced features)
  syncedAt?: Date;                 // Last sync timestamp from provider
  createdAt: Date;
  updatedAt: Date;
  profileOwner: string;
}
