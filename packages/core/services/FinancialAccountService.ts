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
    console.log('[DEBUG] FinancialAccountService.update() - Input:', JSON.stringify({
      id,
      updates: {
        ...updates,
        syncedAt: updates.syncedAt?.toISOString(),
      },
    }, null, 2));

    // Automatically set updatedAt to now
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date(),
    };

    console.log('[DEBUG] FinancialAccountService.update() - After adding timestamp:', JSON.stringify({
      id,
      updatesWithTimestamp: {
        ...updatesWithTimestamp,
        syncedAt: updatesWithTimestamp.syncedAt?.toISOString(),
        updatedAt: updatesWithTimestamp.updatedAt?.toISOString(),
      },
    }, null, 2));

    const entityUpdates = this.converter.toEntity(updatesWithTimestamp as FinancialAccount);

    console.log('[DEBUG] FinancialAccountService.update() - After converter.toEntity():', JSON.stringify({
      id,
      entityUpdates,
    }, null, 2));

    const updated = await this.repository.update(id, entityUpdates);
    return this.converter.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
