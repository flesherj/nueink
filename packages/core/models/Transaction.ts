import { FinancialProvider, Currency } from './types';

/**
 * Transaction Status
 * Represents the clearing/posting status of a transaction
 */
export type TransactionStatus =
  | 'pending'      // Not yet cleared/posted by bank
  | 'posted'       // Cleared/posted by bank (YNAB: cleared, Plaid: posted)
  | 'reconciled';  // Manually reconciled against bank statement (YNAB only)

/**
 * Transaction domain model
 * Represents a financial transaction
 *
 * Note: All monetary amounts are stored as integers in cents (or smallest currency unit).
 * Example: $10.50 is stored as 1050
 */
/**
 * Transaction domain model
 *
 * This is the complete domain model representing the full business entity.
 * It includes both normalized fields (for business logic) and raw provider data
 * (for advanced features, debugging, and future-proofing).
 *
 * Note: When exposing to clients via API/GraphQL, transform to a View Model
 * that excludes rawData and includes only fields appropriate for that context.
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
  status: TransactionStatus;       // Clearing/posting status
  pending: boolean;                // Convenience field: true if status === 'pending'
  personId?: string;               // Auto-assigned person
  receiptUrls?: Array<string>;     // S3 keys for receipts (Phase 2)
  rawData?: Record<string, any>;   // Complete provider response (for debugging, backfill, advanced features)
  syncedAt?: Date;                 // Last sync timestamp from provider
  createdAt: Date;
  updatedAt: Date;
  profileOwner: string;
}

/**
 * TransactionSplit domain model
 * Represents categorization and amount allocation for a transaction.
 *
 * Supports both simple (100% one category) and complex (split across multiple categories) scenarios.
 * All transactions should have at least one split representing the full amount.
 *
 * Note: Sum of all split amounts for a transaction must equal transaction.amount
 */
export interface TransactionSplit {
  splitId: string;
  transactionId: string;           // FK to Transaction
  organizationId: string;          // FK to Organization
  category: string;                // Category for this portion
  amount: number;                  // Portion of transaction amount in cents
  percentage?: number;             // Optional: Percentage of total (0-100)
  notes?: string;                  // Optional: Notes specific to this split
  aiGenerated?: boolean;           // True if AI created this split (vs user manual)
  confidence?: number;             // AI confidence 0-100 (only if aiGenerated=true)
  createdAt: Date;
  updatedAt: Date;
  profileOwner: string;
}
