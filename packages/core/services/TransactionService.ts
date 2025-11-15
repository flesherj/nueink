import { Transaction } from '../models';
import { TransactionConverter } from '../converters';
import { TransactionRepository, PaginationResult } from '../repositories';
import { TransactionEntity } from '@nueink/aws';

/**
 * Transaction service - handles business logic for transaction operations
 */
export class TransactionService {
  private converter: TransactionConverter;

  constructor(private repository: TransactionRepository<TransactionEntity>) {
    this.converter = new TransactionConverter();
  }

  public findById = async (id: string): Promise<Transaction | null> => {
    const entity = await this.repository.findById(id);
    return entity ? this.converter.toDomain(entity) : null;
  };

  public findAll = async (): Promise<Transaction[]> => {
    const entities = await this.repository.findAll();
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public findByOrganization = async (
    organizationId: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginationResult<Transaction>> => {
    const result = await this.repository.findByOrganization(
      organizationId,
      limit,
      cursor
    );
    return {
      items: result.items.map((entity) => this.converter.toDomain(entity)),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  };

  public findByFinancialAccount = async (
    financialAccountId: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginationResult<Transaction>> => {
    const result = await this.repository.findByFinancialAccount(
      financialAccountId,
      limit,
      cursor
    );
    return {
      items: result.items.map((entity) => this.converter.toDomain(entity)),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  };

  public findByPerson = async (
    personId: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginationResult<Transaction>> => {
    const result = await this.repository.findByPerson(personId, limit, cursor);
    return {
      items: result.items.map((entity) => this.converter.toDomain(entity)),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  };

  public findByDateRange = async (
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]> => {
    const entities = await this.repository.findByDateRange(
      organizationId,
      startDate.toISOString(),
      endDate.toISOString()
    );
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public findByExternalTransactionId = async (
    externalId: string
  ): Promise<Transaction | null> => {
    const entity =
      await this.repository.findByExternalTransactionId(externalId);
    return entity ? this.converter.toDomain(entity) : null;
  };

  public findRecent = async (
    organizationId: string,
    limit: number
  ): Promise<Transaction[]> => {
    const entities = await this.repository.findRecent(organizationId, limit);
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public create = async (transaction: Transaction): Promise<Transaction> => {
    const entity = this.converter.toEntity(transaction);
    const saved = await this.repository.save(entity);
    return this.converter.toDomain(saved);
  };

  public update = async (
    id: string,
    updates: Partial<Transaction>
  ): Promise<Transaction> => {
    // Automatically set updatedAt to now
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date(),
    };
    const entityUpdates = this.converter.toEntity(updatesWithTimestamp as Transaction);
    const updated = await this.repository.update(id, entityUpdates);
    return this.converter.toDomain(updated);
  };

  public delete = async (id: string): Promise<void> => {
    await this.repository.delete(id);
  };
}
