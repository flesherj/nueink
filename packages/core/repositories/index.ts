/**
 * Repository interfaces
 * Platform-agnostic contracts for data access
 *
 * Implementations:
 * - AmplifyRepository (packages/aws/repositories) - Uses AWS Amplify GraphQL
 * - Future: SQLiteRepository for offline support
 */

export * from './Repository';
export * from './AccountRepository';
export * from './OrganizationRepository';
export * from './MembershipRepository';
export * from './InstitutionRepository';
export * from './FinancialAccountRepository';
export * from './TransactionRepository';
export * from './CommentRepository';
export * from './PersonRepository';
export * from './BudgetRepository';
export * from './DebtRepository';
export * from './IntegrationConfigRepository';
