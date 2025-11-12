import { FinancialProvider, Currency } from './types';

/**
 * Transaction domain model
 * Represents a financial transaction
 *
 * Note: All monetary amounts are stored as integers in cents (or smallest currency unit).
 * Example: $10.50 is stored as 1050
 */
export interface Transaction {
  transactionId: string;
  financialAccountId: string;
  organizationId: string;
  provider: FinancialProvider;
  externalTransactionId?: string;  // Provider's transaction ID
  amount: number;                  // In cents (1050 = $10.50)
  currency: Currency;              // Normalized currency
  date: Date;                      // Transaction date
  authorizedDate?: Date;
  merchantName?: string;
  name: string;                    // Transaction description
  category?: Array<string>;        // Categories array
  primaryCategory?: string;        // First category for filtering
  pending: boolean;
  personId?: string;               // Auto-assigned person
  receiptUrls?: Array<string>;     // S3 keys for receipts (Phase 2)
  syncedAt?: Date;                 // Last sync timestamp from provider
  createdAt: Date;
  updatedAt: Date;
  profileOwner: string;
}
