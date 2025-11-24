import type { AccountBase } from 'plaid';
import type { FinancialAccount, Currency, FinancialAccountType } from '@nueink/core';

/**
 * Context needed to convert Plaid Account to NueInk FinancialAccount
 */
export interface PlaidAccountConversionContext {
  organizationId: string;
  profileOwner: string;
  institutionId?: string;
  institutionName?: string;
}

/**
 * Convert Plaid Account to NueInk FinancialAccount
 *
 * Stateless converter that transforms Plaid's account format to NueInk's format.
 * Handles account types, balances, and institution information.
 */
export class PlaidAccountConverter {
  public convert = (
    source: AccountBase,
    context: PlaidAccountConversionContext
  ): FinancialAccount => {
    return {
      financialAccountId: source.account_id,
      organizationId: context.organizationId,
      provider: 'plaid',
      externalAccountId: source.account_id,
      name: source.name,
      officialName: source.official_name || source.name,
      type: this.convertAccountType(source.type),
      mask: source.mask || undefined,
      currentBalance: source.balances.current ? Math.round(source.balances.current * 100) : 0,
      availableBalance: source.balances.available ? Math.round(source.balances.available * 100) : undefined,
      currency: (source.balances.iso_currency_code || 'USD') as Currency,
      institutionId: context.institutionId || 'unknown',
      status: 'active' as const,
      syncedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      profileOwner: context.profileOwner,
    };
  };

  /**
   * Convert Plaid account type to NueInk account type
   * Plaid types: depository, credit, loan, investment, other
   * Plaid subtypes provide more detail (checking, savings, credit_card, mortgage, etc.)
   */
  private convertAccountType = (plaidType: string): FinancialAccountType => {
    switch (plaidType.toLowerCase()) {
      case 'depository':
        return 'checking'; // Default for depository, subtype provides more detail
      case 'credit':
        return 'credit_card';
      case 'loan':
        return 'mortgage'; // Default for loan, subtype provides more detail
      case 'investment':
        return 'investment';
      case 'other':
      default:
        return 'asset'; // Fallback to generic asset type
    }
  };
}
