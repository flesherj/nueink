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

  public findById = async (id: string): Promise<Budget | null> => {
    const entity = await this.repository.findById(id);
    return entity ? this.converter.toDomain(entity) : null;
  };

  public findAll = async (): Promise<Budget[]> => {
    const entities = await this.repository.findAll();
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public findByOrganization = async (organizationId: string): Promise<Budget[]> => {
    const entities = await this.repository.findByOrganization(organizationId);
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public findActiveBudget = async (organizationId: string): Promise<Budget | null> => {
    const entity = await this.repository.findActiveByOrganization(organizationId);
    return entity ? this.converter.toDomain(entity) : null;
  };

  public create = async (budget: Budget): Promise<Budget> => {
    const entity = this.converter.toEntity(budget);
    const saved = await this.repository.save(entity);
    return this.converter.toDomain(saved);
  };

  public update = async (id: string, updates: Partial<Budget>): Promise<Budget> => {
    const entityUpdates = this.converter.toEntity(updates as Budget);
    const updated = await this.repository.update(id, entityUpdates);
    return this.converter.toDomain(updated);
  };

  public delete = async (id: string): Promise<void> => {
    await this.repository.delete(id);
  };
}
