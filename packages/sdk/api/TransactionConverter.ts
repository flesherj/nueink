import type { Transaction } from '@nueink/core';
import { parseTransactionDate, parseTimestamp } from '@nueink/core';

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
 * Convert Transaction API response to Transaction domain model.
 * Uses shared date utilities from @nueink/core for consistent date parsing.
 *
 * @param response - Raw transaction data from API
 * @returns Transaction domain model with proper Date objects
 */
export const convertTransactionFromResponse = (response: TransactionResponse): Transaction => {
  return {
    ...response,
    date: parseTransactionDate(response.date)!,
    authorizedDate: parseTransactionDate(response.authorizedDate),
    syncedAt: parseTimestamp(response.syncedAt),
    createdAt: parseTimestamp(response.createdAt)!,
    updatedAt: parseTimestamp(response.updatedAt)!,
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
