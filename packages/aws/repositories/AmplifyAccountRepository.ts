import { v4 as uuid } from 'uuid';
import { AccountEntity } from '../models';
import { AccountRepository } from './AccountRepository';
import type { AmplifyDataClient } from './types';

export class AmplifyAccountRepository implements AccountRepository {
  constructor(private dbClient: AmplifyDataClient) {}

  async findById(id: string): Promise<AccountEntity | null> {
    const response = await this.dbClient.models.Account.get({ accountId: id });
    if (!response.data) {
      return null;
    }
    return this.toAccount(response.data);
  }

  async findAll(): Promise<AccountEntity[]> {
    const response = await this.dbClient.models.Account.list({});
    return response.data.map((item: any) => this.toAccount(item));
  }

  async save(entity: AccountEntity): Promise<AccountEntity> {
    const response = await this.dbClient.models.Account.create({
      accountId: entity.accountId,
      defaultOrgId: entity.defaultOrgId,
      email: entity.email,
      username: entity.username,
      firstName: entity.firstName,
      middleName: entity.middleName,
      lastName: entity.lastName,
      provider: entity.provider,
      createdAt: entity.createdAt,
      status: entity.status,
      profileOwner: entity.profileOwner,
      meta: entity.meta,
    });

    if (!response.data) {
      throw new Error('Failed to create Account: response.data is null');
    }
    return this.toAccount(response.data);
  }

  async update(
    id: string,
    entity: Partial<AccountEntity>
  ): Promise<AccountEntity> {
    const updates: any = { accountId: id };

    if (entity.email !== undefined) updates.email = entity.email;
    if (entity.username !== undefined) updates.username = entity.username;
    if (entity.firstName !== undefined) updates.firstName = entity.firstName;
    if (entity.middleName !== undefined) updates.middleName = entity.middleName;
    if (entity.lastName !== undefined) updates.lastName = entity.lastName;
    if (entity.status !== undefined) updates.status = entity.status;
    if (entity.meta !== undefined) updates.meta = entity.meta;

    const response = await this.dbClient.models.Account.update(updates);
    if (!response.data) {
      throw new Error('Failed to update Account: response.data is null');
    }
    return this.toAccount(response.data);
  }

  async delete(id: string): Promise<void> {
    await this.dbClient.models.Account.delete({ accountId: id });
  }

  async findByEmail(email: string): Promise<AccountEntity | null> {
    const response = await this.dbClient.models.Account.listAccountByEmail({
      email,
    });
    if (response.data.length === 0) {
      return null;
    }
    return this.toAccount(response.data[0]);
  }

  async findByUsername(username: string): Promise<AccountEntity | null> {
    const response = await this.dbClient.models.Account.listAccountByUsername({
      username,
    });
    if (response.data.length === 0) {
      return null;
    }
    return this.toAccount(response.data[0]);
  }

  /**
   * Helper method to create a new Account with defaults
   */
  public create = async (
    provider: string,
    email: string,
    username: string,
    accountId: string,
    profileOwner: string,
    defaultOrgId: string = uuid(),
    firstName?: string,
    middleName?: string,
    lastName?: string
  ): Promise<AccountEntity> => {
    return this.save({
      accountId,
      defaultOrgId,
      email,
      username,
      firstName,
      middleName,
      lastName,
      provider,
      createdAt: new Date().toISOString(),
      status: 'active',
      meta: {
        onboardCompleted: false,
      },
      profileOwner,
    });
  };

  /**
   * Convert Amplify Account entity to AWS AccountEntity type
   */
  private toAccount(data: any): AccountEntity {
    return {
      accountId: data.accountId,
      defaultOrgId: data.defaultOrgId,
      email: data.email,
      username: data.username,
      firstName: data.firstName ?? undefined,
      middleName: data.middleName ?? undefined,
      lastName: data.lastName ?? undefined,
      provider: data.provider,
      createdAt: data.createdAt,
      status: data.status,
      meta: data.meta,
      profileOwner: data.profileOwner,
    };
  }
}
