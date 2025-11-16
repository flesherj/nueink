import { FinancialProvider, Currency } from './types';

export type TransactionEntity = {
  transactionId: string;
  financialAccountId: string;
  organizationId: string;
  provider: FinancialProvider;
  externalTransactionId?: string; // Provider's transaction ID
  amount: number;
  currency: Currency;
  date: string; // Transaction date (ISO string for sorting)
  authorizedDate?: string; // ISO string
  merchantName?: string;
  name: string;
  status: string; // pending | posted | reconciled
  pending: boolean;
  personId?: string; // FK to Person (auto-assigned)
  receiptUrls?: Array<string>; // S3 keys for receipts (Phase 2)
  rawData?: string; // Complete provider response as JSON string (AWSJSON type)
  syncedAt?: string; // Last sync timestamp from provider (ISO string)
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  profileOwner?: string;
};
