import { Converter } from './Converter';
import { Budget } from '../models';
import { BudgetEntity } from '@nueink/aws';

/**
 * Converter for Budget domain model and BudgetEntity
 */
export class BudgetConverter implements Converter<BudgetEntity, Budget> {
  toEntity(domain: Budget): BudgetEntity {
    return {
      budgetId: domain.budgetId,
      organizationId: domain.organizationId,
      category: domain.category,
      amount: domain.amount,
      period: domain.period,
      startDate: domain.startDate.toISOString().split('T')[0],
      endDate: domain.endDate?.toISOString().split('T')[0],
      spent: domain.spent,
      remaining: domain.remaining,
      status: domain.status,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
      profileOwner: domain.profileOwner,
    };
  }

  toDomain(entity: BudgetEntity): Budget {
    return {
      budgetId: entity.budgetId,
      organizationId: entity.organizationId,
      category: entity.category,
      amount: entity.amount,
      period: entity.period,
      startDate: new Date(entity.startDate),
      endDate: entity.endDate ? new Date(entity.endDate) : undefined,
      spent: entity.spent,
      remaining: entity.remaining,
      status: entity.status,
      createdAt: new Date(entity.createdAt),
      updatedAt: new Date(entity.updatedAt),
      profileOwner: entity.profileOwner!,
    };
  }
}
