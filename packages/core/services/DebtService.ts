import { Debt } from '../models';
import { DebtConverter } from '../converters';
import { DebtRepository } from '../repositories';
import { DebtEntity } from '@nueink/aws';

/**
 * Debt service - handles business logic for debt operations
 */
export class DebtService {
  private converter: DebtConverter;

  constructor(private repository: DebtRepository<DebtEntity>) {
    this.converter = new DebtConverter();
  }

  async findById(id: string): Promise<Debt | null> {
    const entity = await this.repository.findById(id);
    return entity ? this.converter.toDomain(entity) : null;
  }

  async findAll(): Promise<Debt[]> {
    const entities = await this.repository.findAll();
    return entities.map((entity) => this.converter.toDomain(entity));
  }

  async findByOrganization(organizationId: string): Promise<Debt[]> {
    const entities = await this.repository.findByOrganization(organizationId);
    return entities.map((entity) => this.converter.toDomain(entity));
  }

  async findActiveDebts(organizationId: string): Promise<Debt[]> {
    const entities = await this.repository.findActiveByOrganization(organizationId);
    return entities.map((entity) => this.converter.toDomain(entity));
  }

  async create(debt: Debt): Promise<Debt> {
    const entity = this.converter.toEntity(debt);
    const saved = await this.repository.save(entity);
    return this.converter.toDomain(saved);
  }

  async update(id: string, updates: Partial<Debt>): Promise<Debt> {
    const entityUpdates = this.converter.toEntity(updates as Debt);
    const updated = await this.repository.update(id, entityUpdates);
    return this.converter.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
