import { AmplifyAccountRepository } from './AmplifyAccountRepository';
import { AmplifyMembershipRepository } from './AmplifyMembershipRepository';
import { AmplifyOrganizationRepository } from './AmplifyOrganizationRepository';
import { AmplifyInstitutionRepository } from './AmplifyInstitutionRepository';
import { AmplifyFinancialAccountRepository } from './AmplifyFinancialAccountRepository';
import { AmplifyTransactionRepository } from './AmplifyTransactionRepository';
import { AmplifyTransactionSplitRepository } from './AmplifyTransactionSplitRepository';
import { AmplifyCommentRepository } from './AmplifyCommentRepository';
import { AmplifyPersonRepository } from './AmplifyPersonRepository';
import { AmplifyBudgetRepository } from './AmplifyBudgetRepository';
import { AmplifyDebtRepository } from './AmplifyDebtRepository';
import { AmplifyIntegrationConfigRepository } from './AmplifyIntegrationConfigRepository';
import { AmplifyDataClient } from './types';

/**
 * Factory for creating Amplify repository instances with lazy initialization
 * All repositories share the same Amplify client instance
 */
export class NueInkRepositoryFactory {
  private static _instance: NueInkRepositoryFactory;
  private _dataClient: AmplifyDataClient;

  private constructor(dataClient: AmplifyDataClient) {
    this._dataClient = dataClient;
  }

  public static getInstance(
    dataClient?: AmplifyDataClient
  ): NueInkRepositoryFactory {
    if (!this._instance && dataClient) {
      this._instance = new NueInkRepositoryFactory(dataClient);
    }
    if (!this._instance) {
      throw new Error(
        'NueInkRepositoryFactory must be initialized with a data client first'
      );
    }
    return this._instance;
  }

  // Public property-based accessors with lazy initialization
  public account = (): AmplifyAccountRepository =>
    new AmplifyAccountRepository(this._dataClient);
  public organization = (): AmplifyOrganizationRepository =>
    new AmplifyOrganizationRepository(this._dataClient);
  public membership = (): AmplifyMembershipRepository =>
    new AmplifyMembershipRepository(this._dataClient);
  public institution = (): AmplifyInstitutionRepository =>
    new AmplifyInstitutionRepository(this._dataClient);
  public financialAccount = (): AmplifyFinancialAccountRepository =>
    new AmplifyFinancialAccountRepository(this._dataClient);
  public transaction = (): AmplifyTransactionRepository =>
    new AmplifyTransactionRepository(this._dataClient);
  public transactionSplit = (): AmplifyTransactionSplitRepository =>
    new AmplifyTransactionSplitRepository(this._dataClient);
  public comment = (): AmplifyCommentRepository =>
    new AmplifyCommentRepository(this._dataClient);
  public person = (): AmplifyPersonRepository =>
    new AmplifyPersonRepository(this._dataClient);
  public budget = (): AmplifyBudgetRepository =>
    new AmplifyBudgetRepository(this._dataClient);
  public debt = (): AmplifyDebtRepository =>
    new AmplifyDebtRepository(this._dataClient);
  public integrationConfig = (): AmplifyIntegrationConfigRepository =>
    new AmplifyIntegrationConfigRepository(this._dataClient);
}
