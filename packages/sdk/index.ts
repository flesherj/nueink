/**
 * @nueink/sdk
 *
 * Official TypeScript SDK for NueInk applications.
 *
 * Provides type-safe API clients for all NueInk operations:
 * - Account management
 * - Financial integrations
 * - Transaction syncing
 *
 * @example
 * ```typescript
 * import { IntegrationApi, AccountApi } from '@nueink/sdk';
 *
 * const integrationApi = IntegrationApi.create();
 * const integrations = await integrationApi.listByAccount('account-123');
 * ```
 */

// API Clients
export * from './api';

// Re-export domain models for convenience
export type {
  Account,
  IntegrationConfig,
  Transaction,
  TransactionSplit,
  FinancialAccount,
  Comment,
} from '@nueink/core';
