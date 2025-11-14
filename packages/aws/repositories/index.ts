// NOTE: Repository interfaces now live in @nueink/core
// Lambda functions should import interfaces from '@nueink/core'
// import { AccountRepository, OrganizationRepository } from '@nueink/core';

// Infrastructure
export * from './NueInkDataClientBuilder';
export * from './NueInkRepositoryFactory';
export * from './ClientRepositoryFactory';  // Client-safe factory for React Native
export * from './types';

// Repository implementations (Lambda-only)
export * from './AmplifyAccountRepository';
export * from './AmplifyOrganizationRepository';
export * from './AmplifyMembershipRepository';
export * from './AmplifyInstitutionRepository';
export * from './AmplifyFinancialAccountRepository';
export * from './AmplifyTransactionRepository';
export * from './AmplifyCommentRepository';
export * from './AmplifyPersonRepository';
export * from './AmplifyBudgetRepository';
export * from './AmplifyDebtRepository';
export * from './AmplifyIntegrationConfigRepository';
