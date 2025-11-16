/**
 * Provider Factory Interface
 *
 * Defines how to create sync providers for different financial integrations.
 * Each provider package implements this to encapsulate its construction logic.
 */

import type { FinancialSyncProvider } from './FinancialSyncProvider';
import type { FinancialOAuthProvider } from '../oauth/FinancialOAuthProvider';
import type { IntegrationTokens } from '../../models';

/**
 * Factory for creating sync providers
 *
 * Each provider (YNAB, Plaid, etc.) implements this to handle:
 * - Creating the appropriate API client
 * - Instantiating the integration wrapper
 * - Creating the sync provider
 */
export interface ProviderFactory {
  /**
   * Create a sync provider for a specific user/integration
   *
   * @param tokens - OAuth tokens for the user's integration
   * @param organizationId - NueInk organization ID
   * @param accountId - NueInk account ID
   * @returns Configured sync provider ready to use
   */
  createSyncProvider(
    tokens: IntegrationTokens,
    organizationId: string,
    accountId: string
  ): FinancialSyncProvider;

  /**
   * Create an OAuth provider for token management
   *
   * @returns Configured OAuth provider for token refresh/exchange
   */
  createOAuthProvider(): FinancialOAuthProvider;
}
