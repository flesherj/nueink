import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import type { AccountRepository } from '@nueink/core/repositories';
import type { AccountEntity } from '../models/Account';

/**
 * Client-Safe Repository Factory
 *
 * Uses Amplify Data client (GraphQL) instead of direct AWS SDK calls.
 * Safe for React Native / Web applications.
 *
 * Usage:
 * ```ts
 * const factory = ClientRepositoryFactory.getInstance();
 * const accountRepo = factory.repository('account');
 * const account = await accountRepo.findById(userId);
 * ```
 */
export class ClientRepositoryFactory {
  private static _instance: ClientRepositoryFactory;
  private client = generateClient<Schema>();

  private constructor() {}

  public static getInstance(): ClientRepositoryFactory {
    if (!this._instance) {
      this._instance = new ClientRepositoryFactory();
    }
    return this._instance;
  }

  /**
   * Create a repository instance for the given type
   */
  public repository<T extends 'account'>(type: T): AccountRepository<AccountEntity> {
    switch (type) {
      case 'account':
        return this.createAccountRepository();
      default:
        throw new Error(`Repository type '${type}' not implemented`);
    }
  }

  private createAccountRepository(): AccountRepository<AccountEntity> {
    const client = this.client;

    return {
      async findById(id: string): Promise<AccountEntity | null> {
        const { data, errors } = await client.models.Account.get({ accountId: id });
        if (errors) {
          console.error('GraphQL errors:', errors);
          return null;
        }
        return data as AccountEntity | null;
      },

      async findAll(): Promise<AccountEntity[]> {
        const { data, errors } = await client.models.Account.list();
        if (errors) {
          console.error('GraphQL errors:', errors);
          return [];
        }
        return (data || []) as AccountEntity[];
      },

      async findByEmail(email: string): Promise<AccountEntity | null> {
        const { data, errors } = await client.models.Account.list({
          filter: { email: { eq: email } },
        });
        if (errors) {
          console.error('GraphQL errors:', errors);
          return null;
        }
        return (data?.[0] as AccountEntity) || null;
      },

      async findByUsername(username: string): Promise<AccountEntity | null> {
        const { data, errors } = await client.models.Account.list({
          filter: { username: { eq: username } },
        });
        if (errors) {
          console.error('GraphQL errors:', errors);
          return null;
        }
        return (data?.[0] as AccountEntity) || null;
      },

      async save(entity: AccountEntity): Promise<AccountEntity> {
        const { data, errors } = await client.models.Account.create(entity as any);
        if (errors) {
          console.error('GraphQL errors:', errors);
          throw new Error(`Failed to create account: ${errors.map((e: any) => e.message).join(', ')}`);
        }
        return data as AccountEntity;
      },

      async update(id: string, updates: Partial<AccountEntity>): Promise<AccountEntity> {
        const { data, errors } = await client.models.Account.update({
          accountId: id,
          ...updates,
        } as any);
        if (errors) {
          console.error('GraphQL errors:', errors);
          throw new Error(`Failed to update account: ${errors.map((e: any) => e.message).join(', ')}`);
        }
        return data as AccountEntity;
      },

      async delete(id: string): Promise<void> {
        const { errors } = await client.models.Account.delete({ accountId: id });
        if (errors) {
          console.error('GraphQL errors:', errors);
          throw new Error(`Failed to delete account: ${errors.map((e: any) => e.message).join(', ')}`);
        }
      },
    };
  }
}
