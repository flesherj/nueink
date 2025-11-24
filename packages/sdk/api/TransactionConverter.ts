import type { Transaction } from '@nueink/core';

/**
 * Transaction API Response
 * Represents the raw JSON response from the API before conversion to domain model.
 * Date fields are ISO strings from the API, not Date objects.
 */
export type TransactionResponse = Omit<Transaction, 'date' | 'authorizedDate' | 'syncedAt' | 'createdAt' | 'updatedAt'> & {
  date: string;
  authorizedDate?: string;
  syncedAt?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Parse a date string in local timezone.
 * API returns dates as ISO strings at midnight UTC (e.g., "2025-11-03T00:00:00.000Z"),
 * but we want to treat them as calendar dates in the local timezone.
 *
 * @param dateValue - ISO date string
 * @returns Date object representing the same calendar date in local timezone
 */
const parseDateString = (dateValue: string | undefined): Date | undefined => {
  if (!dateValue) return undefined;

  const dateParts = dateValue.split('T')[0].split('-'); // "2025-11-03" -> ["2025", "11", "03"]
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // JS months are 0-indexed
  const day = parseInt(dateParts[2], 10);

  // Create date in LOCAL timezone (not UTC)
  return new Date(year, month, day);
};

/**
 * Convert Transaction API response to Transaction domain model.
 * Handles date string parsing and normalization to local timezone.
 *
 * @param response - Raw transaction data from API
 * @returns Transaction domain model with proper Date objects
 */
export const convertTransactionFromResponse = (response: TransactionResponse): Transaction => {
  return {
    ...response,
    date: parseDateString(response.date)!,
    authorizedDate: parseDateString(response.authorizedDate),
    syncedAt: response.syncedAt ? new Date(response.syncedAt) : undefined,
    createdAt: new Date(response.createdAt),
    updatedAt: new Date(response.updatedAt),
  };
};

/**
 * Convert array of Transaction API responses to Transaction domain models.
 *
 * @param responses - Array of raw transaction data from API
 * @returns Array of Transaction domain models
 */
export const convertTransactionsFromResponse = (responses: TransactionResponse[]): Transaction[] => {
  return responses.map(convertTransactionFromResponse);
};
