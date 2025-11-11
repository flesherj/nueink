import { FinancialAccount } from '../models';
import { FinancialAccountConverter } from '../converters';
import { FinancialAccountRepository, PaginationResult } from '../repositories';
import { FinancialAccountEntity } from '@nueink/aws';

/**
 * Financial account service - handles business logic for financial account operations
 */
export class FinancialAccountService {
  private converter: FinancialAccountConverter;

  constructor(private repository: FinancialAccountRepository<FinancialAccountEntity>) {
    this.converter = new FinancialAccountConverter();
  }

  async findById(id: string): Promise<FinancialAccount | null> {
    const entity = await this.repository.findById(id);
    return entity ? this.converter.toDomain(entity) : null;
  }

  async findAll(): Promise<FinancialAccount[]> {
    const entities = await this.repository.findAll();
    return entities.map((entity) => this.converter.toDomain(entity));
  }

  async findByOrganization(
    organizationId: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginationResult<FinancialAccount>> {
    const result = await this.repository.findByOrganization(organizationId, limit, cursor);
    return {
      items: result.items.map((entity) => this.converter.toDomain(entity)),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  }

  async findByInstitution(institutionId: string): Promise<FinancialAccount[]> {
    const entities = await this.repository.findByInstitution(institutionId);
    return entities.map((entity) => this.converter.toDomain(entity));
  }

  async create(financialAccount: FinancialAccount): Promise<FinancialAccount> {
    const entity = this.converter.toEntity(financialAccount);
    const saved = await this.repository.save(entity);
    return this.converter.toDomain(saved);
  }

  async update(id: string, updates: Partial<FinancialAccount>): Promise<FinancialAccount> {
    const entityUpdates = this.converter.toEntity(updates as FinancialAccount);
    const updated = await this.repository.update(id, entityUpdates);
    return this.converter.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
