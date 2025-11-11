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

  async findById(id: string): Promise<Transaction | null> {
    const entity = await this.repository.findById(id);
    return entity ? this.converter.toDomain(entity) : null;
  }

  async findAll(): Promise<Transaction[]> {
    const entities = await this.repository.findAll();
    return entities.map((entity) => this.converter.toDomain(entity));
  }

  async findByOrganization(
    organizationId: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginationResult<Transaction>> {
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
  }

  async findByFinancialAccount(
    financialAccountId: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginationResult<Transaction>> {
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
  }

  async findByPerson(
    personId: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginationResult<Transaction>> {
    const result = await this.repository.findByPerson(personId, limit, cursor);
    return {
      items: result.items.map((entity) => this.converter.toDomain(entity)),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  }

  async findByDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]> {
    const entities = await this.repository.findByDateRange(
      organizationId,
      startDate.toISOString(),
      endDate.toISOString()
    );
    return entities.map((entity) => this.converter.toDomain(entity));
  }

  async findByExternalTransactionId(
    externalId: string
  ): Promise<Transaction | null> {
    const entity =
      await this.repository.findByExternalTransactionId(externalId);
    return entity ? this.converter.toDomain(entity) : null;
  }

  async findRecent(
    organizationId: string,
    limit: number
  ): Promise<Transaction[]> {
    const entities = await this.repository.findRecent(organizationId, limit);
    return entities.map((entity) => this.converter.toDomain(entity));
  }

  async create(transaction: Transaction): Promise<Transaction> {
    const entity = this.converter.toEntity(transaction);
    const saved = await this.repository.save(entity);
    return this.converter.toDomain(saved);
  }

  async update(
    id: string,
    updates: Partial<Transaction>
  ): Promise<Transaction> {
    const entityUpdates = this.converter.toEntity(updates as Transaction);
    const updated = await this.repository.update(id, entityUpdates);
    return this.converter.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
