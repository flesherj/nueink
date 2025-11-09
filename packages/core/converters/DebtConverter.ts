import { Converter } from './Converter';
import { Debt } from '../models';
import { DebtEntity } from '@nueink/aws';

/**
 * Converter for Debt domain model and DebtEntity
 */
export class DebtConverter implements Converter<DebtEntity, Debt> {
  toEntity(domain: Debt): DebtEntity {
    return {
      debtId: domain.debtId,
      organizationId: domain.organizationId,
      financialAccountId: domain.financialAccountId,
      name: domain.name,
      type: domain.type,
      originalBalance: domain.originalBalance,
      currentBalance: domain.currentBalance,
      interestRate: domain.interestRate,
      minimumPayment: domain.minimumPayment,
      dueDate: domain.dueDate,
      status: domain.status,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
      profileOwner: domain.profileOwner,
    };
  }

  toDomain(entity: DebtEntity): Debt {
    return {
      debtId: entity.debtId,
      organizationId: entity.organizationId,
      financialAccountId: entity.financialAccountId,
      name: entity.name,
      type: entity.type,
      originalBalance: entity.originalBalance,
      currentBalance: entity.currentBalance,
      interestRate: entity.interestRate,
      minimumPayment: entity.minimumPayment,
      dueDate: entity.dueDate,
      status: entity.status,
      createdAt: new Date(entity.createdAt),
      updatedAt: new Date(entity.updatedAt),
      profileOwner: entity.profileOwner!,
    };
  }
}
