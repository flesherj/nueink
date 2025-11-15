import type { TransactionDetail as YNABTransaction } from 'ynab';
import { TransactionDetail } from 'ynab';
import type { Transaction, Currency } from '@nueink/core';

/**
 * Context needed to convert YNAB Transaction to NueInk Transaction
 */
export interface YnabTransactionConversionContext {
  organizationId: string;
  profileOwner: string;
}

/**
 * Convert YNAB Transaction to NueInk Transaction
 *
 * Stateless converter that transforms YNAB's transaction format to NueInk's format.
 * Converts YNAB's milliunit amounts (1000 = $1) to cents (100 = $1).
 */
export class YnabTransactionConverter {
  public convert = (
    source: YNABTransaction,
    context: YnabTransactionConversionContext
  ): Transaction => {
    return {
      transactionId: source.id,
      financialAccountId: source.account_id,
      organizationId: context.organizationId,
      provider: 'ynab',
      externalTransactionId: source.id,
      amount: this.convertMilliunitsToCents(source.amount),
      currency: 'USD' as Currency,
      date: new Date(source.date),
      authorizedDate: undefined,
      merchantName: source.payee_name || undefined,
      name: source.memo || source.payee_name || 'Transaction',
      category: source.category_name ? [source.category_name] : undefined,
      primaryCategory: source.category_name || undefined,
      pending: source.cleared === TransactionDetail.ClearedEnum.Uncleared,
      personId: undefined, // Enriched downstream by event handlers
      receiptUrls: undefined,
      rawData: source as unknown as Record<string, any>, // Preserve complete YNAB response
      syncedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      profileOwner: context.profileOwner,
    };
  };

  /**
   * Convert YNAB milliunits to cents
   * YNAB: 1000 milliunits = $1.00
   * NueInk: 100 cents = $1.00
   * Formula: milliunits / 10 = cents
   */
  private convertMilliunitsToCents = (milliunits: number): number => {
    return Math.round(milliunits / 10);
  };
}
