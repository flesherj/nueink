import { AccountType as YNABAccountType } from 'ynab';
import type { Account as YNABAccount } from 'ynab';
import type { FinancialAccount, FinancialAccountType, Currency } from '@nueink/core';

/**
 * Context needed to convert YNAB Account to NueInk FinancialAccount
 */
export interface YnabAccountConversionContext {
  budgetId: string;
  organizationId: string;
  profileOwner: string;
}

/**
 * Convert YNAB Account to NueInk FinancialAccount
 *
 * Stateless converter that transforms YNAB's account format to NueInk's format.
 * Converts YNAB's milliunit amounts (1000 = $1) to cents (100 = $1).
 */
export class YnabAccountConverter {
  public convert = (
    source: YNABAccount,
    context: YnabAccountConversionContext
  ): FinancialAccount => {
    return {
      financialAccountId: source.id,
      institutionId: context.budgetId,
      organizationId: context.organizationId,
      provider: 'ynab',
      externalAccountId: source.id,
      name: source.name,
      officialName: source.name,
      mask: undefined,
      type: this.mapAccountType(source.type),
      currentBalance: this.convertMilliunitsToCents(source.balance),
      availableBalance: this.convertMilliunitsToCents(source.cleared_balance),
      currency: 'USD' as Currency,
      personId: undefined, // Enriched downstream by event handlers
      status: source.closed ? 'closed' : 'active',
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

  /**
   * Map YNAB account type to NueInk FinancialAccountType
   */
  private mapAccountType = (ynabType: YNABAccount['type']): FinancialAccountType => {
    switch (ynabType) {
      case YNABAccountType.Checking:
        return 'checking';
      case YNABAccountType.Savings:
        return 'savings';
      case YNABAccountType.Cash:
        return 'cash';
      case YNABAccountType.CreditCard:
        return 'credit_card';
      case YNABAccountType.LineOfCredit:
        return 'line_of_credit';
      case YNABAccountType.Mortgage:
        return 'mortgage';
      case YNABAccountType.AutoLoan:
        return 'auto_loan';
      case YNABAccountType.StudentLoan:
        return 'student_loan';
      case YNABAccountType.PersonalLoan:
        return 'personal_loan';
      case YNABAccountType.MedicalDebt:
        return 'medical_debt';
      case YNABAccountType.OtherAsset:
        return 'asset';
      case YNABAccountType.OtherLiability:
        return 'liability';
      case YNABAccountType.OtherDebt:
        return 'liability';
      default:
        return 'asset';
    }
  };
}
