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
  AmplifyIntegrationConfigRepository,
  AmplifyDataClient,
} from '.';

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
  integrationConfig: AmplifyIntegrationConfigRepository;
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
 * const client = await initializeAmplifyClient(env);
 * const factory = NueInkRepositoryFactory.getInstance(client);
 * const accountRepo = factory.repository('account');
 * const transactionRepo = factory.repository('transaction');
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
      integrationConfig: () =>
        new AmplifyIntegrationConfigRepository(this._dataClient),
    };

    return repositories[type]();
  }
}
