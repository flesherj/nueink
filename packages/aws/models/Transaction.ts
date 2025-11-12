import { FinancialProvider, Currency } from './types';

export type TransactionEntity = {
  transactionId: string;
  financialAccountId: string;
  organizationId: string;
  provider: FinancialProvider;
  externalTransactionId?: string; // Provider's transaction ID
  amount: number;
  currency: Currency;
  date: string; // Transaction date (for sorting)
  authorizedDate?: string;
  merchantName?: string;
  name: string;
  category?: string[]; // Categories (array for flexibility)
  primaryCategory?: string; // First category for filtering
  pending: boolean;
  personId?: string; // FK to Person (auto-assigned)
  receiptUrls?: string[]; // S3 keys for receipts (Phase 2)
  syncedAt?: string; // Last sync timestamp from provider
  createdAt: string;
  updatedAt: string;
  profileOwner?: string;
};
