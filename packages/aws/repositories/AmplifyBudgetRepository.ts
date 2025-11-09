import { generateClient } from 'aws-amplify/data';
import { type Schema } from '../amplify/data/resource';
import { BudgetEntity } from '../models';
import { BudgetRepository } from './BudgetRepository';

export class AmplifyBudgetRepository implements BudgetRepository {
  constructor(private dbClient = generateClient<Schema>()) {}

  async findById(id: string): Promise<BudgetEntity | null> {
    const response = await this.dbClient.models.Budget.get({ budgetId: id });
    if (!response.data) {
      return null;
    }
    return this.toBudget(response.data);
  }

  async findAll(): Promise<BudgetEntity[]> {
    const response = await this.dbClient.models.Budget.list();
    return response.data.map((item) => this.toBudget(item));
  }

  async save(entity: BudgetEntity): Promise<BudgetEntity> {
    const response = await this.dbClient.models.Budget.create({
      budgetId: entity.budgetId,
      organizationId: entity.organizationId,
      category: entity.category,
      amount: entity.amount,
      period: entity.period,
      startDate: entity.startDate.toISOString(),
      endDate: entity.endDate.toISOString(),
      spent: entity.spent,
      remaining: entity.remaining,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      profileOwner: entity.profileOwner,
    });

    return this.toBudget(response.data!);
  }

  async update(id: string, entity: Partial<BudgetEntity>): Promise<BudgetEntity> {
    const updates: any = { budgetId: id };

    if (entity.category !== undefined) updates.category = entity.category;
    if (entity.amount !== undefined) updates.amount = entity.amount;
    if (entity.period !== undefined) updates.period = entity.period;
    if (entity.startDate !== undefined)
      updates.startDate = entity.startDate.toISOString();
    if (entity.endDate !== undefined)
      updates.endDate = entity.endDate.toISOString();
    if (entity.spent !== undefined) updates.spent = entity.spent;
    if (entity.remaining !== undefined) updates.remaining = entity.remaining;
    if (entity.status !== undefined) updates.status = entity.status;
    if (entity.updatedAt !== undefined)
      updates.updatedAt = entity.updatedAt.toISOString();

    const response = await this.dbClient.models.Budget.update(updates);
    return this.toBudget(response.data!);
  }

  async delete(id: string): Promise<void> {
    await this.dbClient.models.Budget.delete({ budgetId: id });
  }

  async findByOrganization(organizationId: string): Promise<BudgetEntity[]> {
    const response = await this.dbClient.models.Budget.listBudgetByOrganizationId({
      organizationId,
    });
    return response.data.map((item) => this.toBudget(item));
  }

  async findActiveByOrganization(organizationId: string): Promise<BudgetEntity[]> {
    const allBudgets = await this.findByOrganization(organizationId);
    return allBudgets.filter((budget) => budget.status === 'active');
  }

  async findByCategory(
    organizationId: string,
    category: string
  ): Promise<BudgetEntity | null> {
    const allBudgets = await this.findByOrganization(organizationId);
    const found = allBudgets.find((budget) => budget.category === category);
    return found ?? null;
  }

  /**
   * Convert Amplify Budget entity to BudgetEntity
   */
  private toBudget(data: any): BudgetEntity {
    return {
      budgetId: data.budgetId,
      organizationId: data.organizationId,
      category: data.category,
      amount: data.amount,
      period: data.period,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      spent: data.spent ?? undefined,
      remaining: data.remaining ?? undefined,
      status: data.status,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      profileOwner: data.profileOwner ?? undefined,
    };
  }
}
