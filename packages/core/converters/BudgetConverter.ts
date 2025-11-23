import { Converter } from './Converter';
import { Budget, CategoryBudget } from '../models';
import { BudgetEntity, CategoryBudgetEntity } from '@nueink/aws';

/**
 * Converter for Budget domain model and BudgetEntity
 */
export class BudgetConverter implements Converter<BudgetEntity, Budget> {
  public toEntity = (domain: Budget): BudgetEntity => {
    return {
      budgetId: domain.budgetId,
      accountId: domain.accountId,
      organizationId: domain.organizationId,
      name: domain.name,
      periodStart: domain.periodStart.toISOString(),
      periodEnd: domain.periodEnd.toISOString(),
      categoryBudgets: domain.categoryBudgets,
      totalBudget: domain.totalBudget,
      status: domain.status,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
      profileOwner: domain.profileOwner,
      sourceAnalysisId: domain.sourceAnalysisId,
    };
  };

  public toDomain = (entity: BudgetEntity): Budget => {
    return {
      budgetId: entity.budgetId,
      accountId: entity.accountId,
      organizationId: entity.organizationId,
      name: entity.name,
      periodStart: new Date(entity.periodStart),
      periodEnd: new Date(entity.periodEnd),
      categoryBudgets: entity.categoryBudgets,
      totalBudget: entity.totalBudget,
      status: entity.status,
      createdAt: new Date(entity.createdAt),
      updatedAt: new Date(entity.updatedAt),
      profileOwner: entity.profileOwner,
      sourceAnalysisId: entity.sourceAnalysisId,
    };
  };
}
