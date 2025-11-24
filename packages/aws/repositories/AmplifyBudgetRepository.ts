import { BudgetRepository } from '@nueink/core';
import type { AmplifyDataClient } from './types';
import { BudgetEntity } from '../models';

export class AmplifyBudgetRepository implements BudgetRepository<BudgetEntity> {
  constructor(private dbClient: AmplifyDataClient) {}

  public findById = async (id: string): Promise<BudgetEntity | null> => {
    const response = await this.dbClient.models.Budget.get({ budgetId: id });
    if (!response.data) {
      return null;
    }
    return this.toBudget(response.data);
  };

  public findAll = async (): Promise<BudgetEntity[]> => {
    const response = await this.dbClient.models.Budget.list({});
    return response.data.map((item: any) => this.toBudget(item));
  };

  public save = async (entity: BudgetEntity): Promise<BudgetEntity> => {
    const response = await this.dbClient.models.Budget.create({
      budgetId: entity.budgetId,
      accountId: entity.accountId,
      organizationId: entity.organizationId,
      name: entity.name,
      periodStart: entity.periodStart,
      periodEnd: entity.periodEnd,
      categoryBudgets: entity.categoryBudgets,
      totalBudget: entity.totalBudget,
      monthlyIncome: entity.monthlyIncome,
      surplus: entity.surplus,
      availableForDebt: entity.availableForDebt,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      profileOwner: entity.profileOwner,
      sourceAnalysisId: entity.sourceAnalysisId,
    });

    if (!response.data) {
      throw new Error('Failed to create Budget: response.data is null');
    }
    return this.toBudget(response.data);
  };

  public update = async (id: string, entity: Partial<BudgetEntity>): Promise<BudgetEntity> => {
    const updates: any = { budgetId: id };

    if (entity.accountId !== undefined) updates.accountId = entity.accountId;
    if (entity.organizationId !== undefined) updates.organizationId = entity.organizationId;
    if (entity.name !== undefined) updates.name = entity.name;
    if (entity.periodStart !== undefined) updates.periodStart = entity.periodStart;
    if (entity.periodEnd !== undefined) updates.periodEnd = entity.periodEnd;
    if (entity.categoryBudgets !== undefined) updates.categoryBudgets = entity.categoryBudgets;
    if (entity.totalBudget !== undefined) updates.totalBudget = entity.totalBudget;
    if (entity.monthlyIncome !== undefined) updates.monthlyIncome = entity.monthlyIncome;
    if (entity.surplus !== undefined) updates.surplus = entity.surplus;
    if (entity.availableForDebt !== undefined) updates.availableForDebt = entity.availableForDebt;
    if (entity.status !== undefined) updates.status = entity.status;
    if (entity.updatedAt !== undefined) updates.updatedAt = entity.updatedAt;
    if (entity.sourceAnalysisId !== undefined) updates.sourceAnalysisId = entity.sourceAnalysisId;

    const response = await this.dbClient.models.Budget.update(updates);
    if (!response.data) {
      throw new Error('Failed to update Budget: response.data is null');
    }
    return this.toBudget(response.data);
  };

  public delete = async (id: string): Promise<void> => {
    await this.dbClient.models.Budget.delete({ budgetId: id });
  };

  public findByOrganization = async (organizationId: string): Promise<BudgetEntity[]> => {
    const response = await this.dbClient.models.Budget.listBudgetByOrganizationId({
      organizationId,
    });
    return response.data.map((item: any) => this.toBudget(item));
  };

  public findActiveByOrganization = async (
    organizationId: string
  ): Promise<BudgetEntity | null> => {
    const allBudgets = await this.findByOrganization(organizationId);
    const found = allBudgets.find((budget: any) => budget.status === 'active');
    return found ?? null;
  };

  public findByAccount = async (accountId: string): Promise<BudgetEntity[]> => {
    const response = await this.dbClient.models.Budget.listBudgetByAccountId({
      accountId,
    });
    return response.data.map((item: any) => this.toBudget(item));
  };

  public findByStatus = async (
    organizationId: string,
    status: 'baseline' | 'optimized' | 'active' | 'archived'
  ): Promise<BudgetEntity[]> => {
    const allBudgets = await this.findByOrganization(organizationId);
    return allBudgets.filter((budget: any) => budget.status === status);
  };

  /**
   * Convert Amplify Budget entity to BudgetEntity
   */
  private toBudget = (data: any): BudgetEntity => {
    return {
      budgetId: data.budgetId,
      accountId: data.accountId,
      organizationId: data.organizationId,
      name: data.name,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      categoryBudgets: data.categoryBudgets ?? [],
      totalBudget: data.totalBudget,
      monthlyIncome: data.monthlyIncome,
      surplus: data.surplus,
      availableForDebt: data.availableForDebt ?? undefined,
      status: data.status,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      profileOwner: data.profileOwner ?? undefined,
      sourceAnalysisId: data.sourceAnalysisId ?? undefined,
    };
  };
}
