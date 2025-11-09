import { NueInkRepositoryFactory } from '@nueink/aws';
import {
  AccountService,
  OrganizationService,
  MembershipService,
  InstitutionService,
  FinancialAccountService,
  TransactionService,
  CommentService,
  PersonService,
  BudgetService,
  DebtService,
} from './';

/**
 * Service type mapping for type-safe factory method
 */
type ServiceMap = {
  account: AccountService;
  organization: OrganizationService;
  membership: MembershipService;
  institution: InstitutionService;
  financialAccount: FinancialAccountService;
  transaction: TransactionService;
  comment: CommentService;
  person: PersonService;
  budget: BudgetService;
  debt: DebtService;
};

/**
 * Valid service type keys (matches repository type keys)
 */
export type ServiceType = keyof ServiceMap;

/**
 * Factory for creating NueInk service instances
 * All services share the same repository factory instance
 *
 * @example
 * const factory = NueInkServiceFactory.getInstance();
 * const accountService = factory.service('account');
 * const transactionService = factory.service('transaction');
 */
export class NueInkServiceFactory {
  private static _instance: NueInkServiceFactory;
  private _repositoryFactory: NueInkRepositoryFactory;

  private constructor() {
    this._repositoryFactory = NueInkRepositoryFactory.getInstance();
  }

  public static getInstance(): NueInkServiceFactory {
    if (!this._instance) {
      this._instance = new NueInkServiceFactory();
    }
    return this._instance;
  }

  /**
   * Generic service factory method with type inference
   * @param type - The service type to create
   * @returns Typed service instance
   */
  public service<T extends ServiceType>(type: T): ServiceMap[T] {
    const services: {
      [K in ServiceType]: () => ServiceMap[K];
    } = {
      account: () =>
        new AccountService(this._repositoryFactory.repository('account')),
      organization: () =>
        new OrganizationService(
          this._repositoryFactory.repository('organization')
        ),
      membership: () =>
        new MembershipService(this._repositoryFactory.repository('membership')),
      institution: () =>
        new InstitutionService(
          this._repositoryFactory.repository('institution')
        ),
      financialAccount: () =>
        new FinancialAccountService(
          this._repositoryFactory.repository('financialAccount')
        ),
      transaction: () =>
        new TransactionService(
          this._repositoryFactory.repository('transaction')
        ),
      comment: () =>
        new CommentService(this._repositoryFactory.repository('comment')),
      person: () =>
        new PersonService(this._repositoryFactory.repository('person')),
      budget: () =>
        new BudgetService(this._repositoryFactory.repository('budget')),
      debt: () => new DebtService(this._repositoryFactory.repository('debt')),
    };

    return services[type]();
  }
}
