import { NueInkDataClientBuilder } from './NueInkDataClientBuilder';
import {
  AmplifyAccountRepository,
  AmplifyMembershipRepository,
  AmplifyOrganizationRepository,
  AmplifyInstitutionRepository,
  AmplifyFinancialAccountRepository,
  AmplifyTransactionRepository,
  AmplifyCommentRepository,
  AmplifyPersonRepository,
  AmplifyBudgetRepository,
  AmplifyDebtRepository,
} from './repositories';

/**
 * Repository type mapping for type-safe factory method
 */
type RepositoryMap = {
  account: AmplifyAccountRepository;
  organization: AmplifyOrganizationRepository;
  membership: AmplifyMembershipRepository;
  institution: AmplifyInstitutionRepository;
  financialAccount: AmplifyFinancialAccountRepository;
  transaction: AmplifyTransactionRepository;
  comment: AmplifyCommentRepository;
  person: AmplifyPersonRepository;
  budget: AmplifyBudgetRepository;
  debt: AmplifyDebtRepository;
};

/**
 * Valid repository type keys
 */
export type RepositoryType = keyof RepositoryMap;

/**
 * Factory for creating Amplify repository instances
 * All repositories share the same Amplify client instance
 *
 * @example
 * const factory = NueInkRepositoryFactory.getInstance();
 * const accountRepo = factory.repository('account');
 * const transactionRepo = factory.repository('transaction');
 */
export class NueInkRepositoryFactory {
  private static _instance: NueInkRepositoryFactory;
  private _dataClient: any;

  private constructor() {
    this._dataClient = NueInkDataClientBuilder.builder().build();
  }

  public static getInstance(): NueInkRepositoryFactory {
    if (!this._instance) {
      this._instance = new NueInkRepositoryFactory();
    }
    return this._instance;
  }

  /**
   * Generic repository factory method with type inference
   * @param type - The repository type to create
   * @returns Typed repository instance
   */
  public repository<T extends RepositoryType>(type: T): RepositoryMap[T] {
    const repositories: {
      [K in RepositoryType]: () => RepositoryMap[K];
    } = {
      account: () => new AmplifyAccountRepository(this._dataClient),
      organization: () => new AmplifyOrganizationRepository(this._dataClient),
      membership: () => new AmplifyMembershipRepository(this._dataClient),
      institution: () => new AmplifyInstitutionRepository(this._dataClient),
      financialAccount: () =>
        new AmplifyFinancialAccountRepository(this._dataClient),
      transaction: () => new AmplifyTransactionRepository(this._dataClient),
      comment: () => new AmplifyCommentRepository(this._dataClient),
      person: () => new AmplifyPersonRepository(this._dataClient),
      budget: () => new AmplifyBudgetRepository(this._dataClient),
      debt: () => new AmplifyDebtRepository(this._dataClient),
    };

    return repositories[type]();
  }
}

