import type { FinancialIntegration, FinancialProvider } from '../models';

/**
 * Configuration needed to create a financial integration instance
 * (Runtime config, not to be confused with IntegrationConfig DB model)
 */
export interface CreateIntegrationConfig {
  provider: FinancialProvider;
  organizationId: string;
  profileOwner: string;
  credentials: ProviderCredentials;
}

/**
 * Provider-specific credentials
 */
export type ProviderCredentials =
  | YnabCredentials
  | PlaidCredentials
  | ManualCredentials;

export interface YnabCredentials {
  type: 'ynab';
  accessToken: string;
}

export interface PlaidCredentials {
  type: 'plaid';
  accessToken: string;
}

export interface ManualCredentials {
  type: 'manual';
  // No credentials needed for manual accounts
}

/**
 * Factory for creating FinancialIntegration instances
 *
 * This is an abstract class that must be implemented by platform-specific
 * factories (e.g., Lambda factory, React Native factory) that know how to
 * import and instantiate the provider SDKs.
 *
 * Example implementation:
 * ```typescript
 * export class LambdaFinancialIntegrationFactory extends FinancialIntegrationFactory {
 *   protected createYnabIntegration(config: CreateIntegrationConfig): FinancialIntegration {
 *     const { YnabIntegration } = require('@nueink/ynab');
 *     return new YnabIntegration(
 *       config.credentials.accessToken,
 *       config.organizationId,
 *       config.profileOwner
 *     );
 *   }
 *
 *   protected createPlaidIntegration(config: CreateIntegrationConfig): FinancialIntegration {
 *     const { PlaidIntegration } = require('@nueink/plaid');
 *     return new PlaidIntegration(...);
 *   }
 * }
 * ```
 */
export abstract class FinancialIntegrationFactory {
  /**
   * Create a FinancialIntegration instance based on provider
   */
  public create(config: CreateIntegrationConfig): FinancialIntegration {
    switch (config.provider) {
      case 'ynab':
        if (config.credentials.type !== 'ynab') {
          throw new Error('Invalid credentials type for YNAB provider');
        }
        return this.createYnabIntegration(config);

      case 'plaid':
        if (config.credentials.type !== 'plaid') {
          throw new Error('Invalid credentials type for Plaid provider');
        }
        return this.createPlaidIntegration(config);

      case 'manual':
        return this.createManualIntegration(config);

      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  /**
   * Create YNAB integration instance
   * Must be implemented by platform-specific factory
   */
  protected abstract createYnabIntegration(
    config: CreateIntegrationConfig
  ): FinancialIntegration;

  /**
   * Create Plaid integration instance
   * Must be implemented by platform-specific factory
   */
  protected abstract createPlaidIntegration(
    config: CreateIntegrationConfig
  ): FinancialIntegration;

  /**
   * Create manual integration instance
   * Must be implemented by platform-specific factory
   */
  protected abstract createManualIntegration(
    config: CreateIntegrationConfig
  ): FinancialIntegration;
}
