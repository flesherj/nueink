import type { Transaction as PlaidTransaction, Location } from 'plaid';
import type { Transaction, Currency, TransactionStatus, TransactionLocation } from '@nueink/core';
import { parseTransactionDate } from '@nueink/core';

/**
 * Context needed to convert Plaid Transaction to NueInk Transaction
 */
export interface PlaidTransactionConversionContext {
  organizationId: string;
  profileOwner: string;
}

/**
 * Convert Plaid Transaction to NueInk Transaction
 *
 * Stateless converter that transforms Plaid's transaction format to NueInk's format.
 *
 * Key Differences from YNAB:
 * - Plaid amounts are POSITIVE for debits (money out), NEGATIVE for credits (money in)
 * - NueInk uses NEGATIVE for expenses, POSITIVE for income
 * - Therefore: NueInk amount = -Plaid amount * 100 (convert to cents and flip sign)
 */
export class PlaidTransactionConverter {
  public convert = (
    source: PlaidTransaction,
    context: PlaidTransactionConversionContext
  ): Transaction => {
    // Plaid amounts: positive = debit (expense), negative = credit (income)
    // NueInk amounts: negative = expense, positive = income
    // Therefore: flip the sign and convert dollars to cents
    const amount = Math.round(-source.amount * 100);

    const status = this.convertStatus(source.pending);

    // Use shared date parsing utility to handle timezone correctly
    const transactionDate = parseTransactionDate(source.date)!;
    const authorizedDate = source.authorized_date
      ? parseTransactionDate(source.authorized_date)
      : undefined;

    return {
      transactionId: source.transaction_id,
      financialAccountId: source.account_id,
      organizationId: context.organizationId,
      provider: 'plaid',
      externalTransactionId: source.transaction_id,
      amount,
      currency: (source.iso_currency_code || 'USD') as Currency,
      date: transactionDate,
      authorizedDate,
      merchantName: source.merchant_name || undefined,
      name: source.name || source.merchant_name || 'Transaction',
      status,
      pending: source.pending,
      personId: undefined, // Enriched downstream by event handlers
      receiptUrls: undefined,

      // Enriched fields from Plaid
      merchantLogoUrl: source.logo_url || undefined,
      merchantWebsite: source.website || undefined,
      location: this.convertLocation(source.location),
      paymentChannel: this.convertPaymentChannel(source.payment_channel),
      personalFinanceCategory: source.personal_finance_category?.primary || undefined,

      rawData: source as unknown as Record<string, any>, // Complete Plaid response for debugging and AI categorization
      syncedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      profileOwner: context.profileOwner,
    };
  };

  /**
   * Convert Plaid pending status to TransactionStatus
   * Plaid: pending boolean
   * NueInk: pending | posted | reconciled
   */
  private convertStatus = (pending: boolean): TransactionStatus => {
    return pending ? 'pending' : 'posted';
  };

  /**
   * Convert Plaid location to TransactionLocation
   */
  private convertLocation = (location: Location | null | undefined): TransactionLocation | undefined => {
    if (!location) return undefined;

    return {
      address: location.address || undefined,
      city: location.city || undefined,
      region: location.region || undefined,
      postalCode: location.postal_code || undefined,
      country: location.country || undefined,
      lat: location.lat || undefined,
      lon: location.lon || undefined,
    };
  };

  /**
   * Convert Plaid payment channel to our enum
   * Plaid values: online, in store, other, null
   */
  private convertPaymentChannel = (
    channel: string | null | undefined
  ): 'online' | 'in store' | 'other' | undefined => {
    if (!channel) return undefined;

    switch (channel.toLowerCase()) {
      case 'online':
        return 'online';
      case 'in store':
        return 'in store';
      case 'other':
      default:
        return 'other';
    }
  };
}
