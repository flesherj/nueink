import { Repository } from './Repository';

/**
 * IntegrationConfig repository interface
 * @template T - The integration config entity type
 */
export interface IntegrationConfigRepository<T> extends Repository<T> {
  /**
   * Find all integrations for an account
   */
  findByAccountId(accountId: string): Promise<T[]>;

  /**
   * Find specific integration by account and provider
   */
  findByAccountIdAndProvider(accountId: string, provider: string): Promise<T | null>;

  /**
   * Find all integrations for an organization
   */
  findByOrganizationId(organizationId: string): Promise<T[]>;

  /**
   * Find all active integrations for an account
   */
  findActiveByAccountId(accountId: string): Promise<T[]>;

  /**
   * Find all active integrations across all accounts (for sync jobs)
   */
  findAllActive(): Promise<T[]>;
}
