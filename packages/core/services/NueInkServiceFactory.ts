import { NueInkRepositoryFactory } from '@nueink/aws';
import { AccountService } from './AccountService';
import { OrganizationService } from './OrganizationService';
import { MembershipService } from './MembershipService';
import { InstitutionService } from './InstitutionService';
import { FinancialAccountService } from './FinancialAccountService';
import { TransactionService } from './TransactionService';
import { TransactionSplitService } from './TransactionSplitService';
import { UserCategorizationFeedbackService } from './UserCategorizationFeedbackService';
import { CommentService } from './CommentService';
import { PersonService } from './PersonService';
import { BudgetService } from './BudgetService';
import { DebtService } from './DebtService';
import { IntegrationService } from './IntegrationService';
import { AnalyticsService } from './AnalyticsService';
import { FinancialAnalysisService } from './FinancialAnalysisService';
import type { SecretManager } from './SecretManager';
import type { EventPublisher } from '../events';

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
  transactionSplit: TransactionSplitService<any>;
  userCategorizationFeedback: UserCategorizationFeedbackService<any>;
  comment: CommentService;
  person: PersonService;
  budget: BudgetService;
  debt: DebtService;
  integration: IntegrationService;
  analytics: AnalyticsService;
  financialAnalysis: FinancialAnalysisService;
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
 * const factory = NueInkServiceFactory.getInstance(repositoryFactory);
 * const accountService = factory.account();
 * const txnService = factory.transaction();
 */
export class NueInkServiceFactory {
  private static _instance: NueInkServiceFactory;
  private _repositoryFactory: NueInkRepositoryFactory;

  private constructor(repositoryFactory: NueInkRepositoryFactory) {
    this._repositoryFactory = repositoryFactory;
  }

  public static getInstance(
    repositoryFactory = NueInkRepositoryFactory.getInstance()
  ): NueInkServiceFactory {
    if (!this._instance) {
      this._instance = new NueInkServiceFactory(repositoryFactory);
    }
    return this._instance;
  }

  // Public property-based accessors
  public account = (): AccountService =>
    new AccountService(this._repositoryFactory.account());
  public organization = (): OrganizationService =>
    new OrganizationService(this._repositoryFactory.organization());
  public membership = (): MembershipService =>
    new MembershipService(this._repositoryFactory.membership());
  public institution = (): InstitutionService =>
    new InstitutionService(this._repositoryFactory.institution());
  public financialAccount = (): FinancialAccountService =>
    new FinancialAccountService(this._repositoryFactory.financialAccount());
  public transactionSplit = (): TransactionSplitService<any> =>
    new TransactionSplitService(this._repositoryFactory.transactionSplit());
  public userCategorizationFeedback = (): UserCategorizationFeedbackService<any> =>
    new UserCategorizationFeedbackService(this._repositoryFactory.userCategorizationFeedback());
  public transaction = (): TransactionService =>
    new TransactionService(this._repositoryFactory.transaction(), this.transactionSplit());
  public comment = (): CommentService =>
    new CommentService(this._repositoryFactory.comment());
  public person = (): PersonService =>
    new PersonService(this._repositoryFactory.person());
  public budget = (): BudgetService =>
    new BudgetService(this._repositoryFactory.budget());
  public debt = (): DebtService =>
    new DebtService(this._repositoryFactory.debt());
  public integration = (secretManager?: SecretManager, eventPublisher?: EventPublisher): IntegrationService =>
    new IntegrationService(this._repositoryFactory.integrationConfig(), secretManager, eventPublisher);
  public analytics = (): AnalyticsService =>
    new AnalyticsService(this.transaction(), this.transactionSplit());
  public financialAnalysis = (): FinancialAnalysisService =>
    new FinancialAnalysisService(this.transaction(), this.transactionSplit());
}
