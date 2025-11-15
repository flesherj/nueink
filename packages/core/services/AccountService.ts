import { Account } from '../models';
import { AccountConverter } from '../converters';
import { AccountRepository } from '../repositories';
import { AccountEntity } from '@nueink/aws';

/**
 * Account service - handles business logic for account operations
 */
export class AccountService {
  private converter: AccountConverter;

  constructor(private repository: AccountRepository<AccountEntity>) {
    this.converter = new AccountConverter();
  }

  public findById = async (id: string): Promise<Account | null> => {
    const entity = await this.repository.findById(id);
    return entity ? this.converter.toDomain(entity) : null;
  };

  public findAll = async (): Promise<Account[]> => {
    const entities = await this.repository.findAll();
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public findByEmail = async (email: string): Promise<Account | null> => {
    const entity = await this.repository.findByEmail(email);
    return entity ? this.converter.toDomain(entity) : null;
  };

  public findByUsername = async (username: string): Promise<Account | null> => {
    const entity = await this.repository.findByUsername(username);
    return entity ? this.converter.toDomain(entity) : null;
  };

  public create = async (account: Account): Promise<Account> => {
    const entity = this.converter.toEntity(account);
    const saved = await this.repository.save(entity);
    return this.converter.toDomain(saved);
  };

  public update = async (id: string, updates: Partial<Account>): Promise<Account> => {
    const entityUpdates = this.converter.toEntity(updates as Account);
    const updated = await this.repository.update(id, entityUpdates);
    return this.converter.toDomain(updated);
  };

  public delete = async (id: string): Promise<void> => {
    await this.repository.delete(id);
  };
}
