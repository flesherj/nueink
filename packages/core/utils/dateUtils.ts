/**
 * Date Utilities
 * Shared utilities for handling transaction dates across client and server.
 *
 * Transaction dates from APIs/databases are ISO strings at midnight UTC (e.g., "2025-11-03T00:00:00.000Z").
 * We treat them as calendar dates in the local timezone, not as UTC timestamps.
 */

/**
 * Parse a transaction date string as a local calendar date.
 *
 * @param dateValue - Date string, Date object, or null/undefined
 * @returns Date object representing the same calendar date in local timezone, or undefined
 *
 * @example
 * // Input: "2025-11-03T00:00:00.000Z"
 * // Output: Date object for Nov 3, 2025 at 00:00:00 local time (not UTC)
 */
export const parseTransactionDate = (
  dateValue: string | Date | undefined | null
): Date | undefined => {
  if (!dateValue) return undefined;
  if (dateValue instanceof Date) return dateValue;

  // Parse date string components (YYYY-MM-DD) to create a local Date
  const dateParts = dateValue.split('T')[0].split('-'); // "2025-11-03" -> ["2025", "11", "03"]
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // JS months are 0-indexed
  const day = parseInt(dateParts[2], 10);

  // Create date in LOCAL timezone (not UTC)
  return new Date(year, month, day);
};

/**
 * Parse a timestamp string to Date object.
 * For timestamps (syncedAt, createdAt, updatedAt), we want the actual moment in time.
 *
 * @param value - Timestamp string, Date object, or null/undefined
 * @returns Date object representing the moment in time, or undefined
 */
export const parseTimestamp = (
  value: string | Date | undefined | null
): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  return new Date(value);
};

/**
 * Check if a date falls within a period (inclusive)
 *
 * @param date - Date to check
 * @param periodStart - Start of period (inclusive)
 * @param periodEnd - End of period (inclusive)
 * @returns True if date is within period
 */
export const isDateInPeriod = (
  date: Date,
  periodStart: Date,
  periodEnd: Date
): boolean => {
  return date >= periodStart && date <= periodEnd;
};

/**
 * Get the start of day for a date (00:00:00.000)
 *
 * @param date - Date to get start of day for
 * @returns New Date object at start of day
 */
export const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Get the end of day for a date (23:59:59.999)
 *
 * @param date - Date to get end of day for
 * @returns New Date object at end of day
 */
export const endOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};
