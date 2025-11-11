import { Budget } from '../models';
import { BudgetConverter } from '../converters';
import { BudgetRepository } from '../repositories';
import { BudgetEntity } from '@nueink/aws';

/**
 * Budget service - handles business logic for budget operations
 */
export class BudgetService {
  private converter: BudgetConverter;

  constructor(private repository: BudgetRepository<BudgetEntity>) {
    this.converter = new BudgetConverter();
  }

  async findById(id: string): Promise<Budget | null> {
    const entity = await this.repository.findById(id);
    return entity ? this.converter.toDomain(entity) : null;
  }

  async findAll(): Promise<Budget[]> {
    const entities = await this.repository.findAll();
    return entities.map((entity) => this.converter.toDomain(entity));
  }

  async findByOrganization(organizationId: string): Promise<Budget[]> {
    const entities = await this.repository.findByOrganization(organizationId);
    return entities.map((entity) => this.converter.toDomain(entity));
  }

  async findActiveBudgets(organizationId: string): Promise<Budget[]> {
    const entities = await this.repository.findActiveByOrganization(organizationId);
    return entities.map((entity) => this.converter.toDomain(entity));
  }

  async create(budget: Budget): Promise<Budget> {
    const entity = this.converter.toEntity(budget);
    const saved = await this.repository.save(entity);
    return this.converter.toDomain(saved);
  }

  async update(id: string, updates: Partial<Budget>): Promise<Budget> {
    const entityUpdates = this.converter.toEntity(updates as Budget);
    const updated = await this.repository.update(id, entityUpdates);
    return this.converter.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
