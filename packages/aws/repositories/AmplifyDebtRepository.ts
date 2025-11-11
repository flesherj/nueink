import { DebtRepository } from '@nueink/core';
import type { AmplifyDataClient } from './types';
import { DebtEntity } from '../models';

export class AmplifyDebtRepository implements DebtRepository<DebtEntity> {
  constructor(private dbClient: AmplifyDataClient) {}

  async findById(id: string): Promise<DebtEntity | null> {
    const response = await this.dbClient.models.Debt.get({ debtId: id });
    if (!response.data) {
      return null;
    }
    return this.toDebt(response.data);
  }

  async findAll(): Promise<DebtEntity[]> {
    const response = await this.dbClient.models.Debt.list({});
    return response.data.map((item: any) => this.toDebt(item));
  }

  async save(entity: DebtEntity): Promise<DebtEntity> {
    const response = await this.dbClient.models.Debt.create({
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
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      profileOwner: entity.profileOwner,
    });

    if (!response.data) {
      throw new Error('Failed to create Debt: response.data is null');
    }
    return this.toDebt(response.data);
  }

  async update(id: string, entity: Partial<DebtEntity>): Promise<DebtEntity> {
    const updates: any = { debtId: id };

    if (entity.name !== undefined) updates.name = entity.name;
    if (entity.currentBalance !== undefined)
      updates.currentBalance = entity.currentBalance;
    if (entity.interestRate !== undefined)
      updates.interestRate = entity.interestRate;
    if (entity.minimumPayment !== undefined)
      updates.minimumPayment = entity.minimumPayment;
    if (entity.dueDate !== undefined) updates.dueDate = entity.dueDate;
    if (entity.status !== undefined) updates.status = entity.status;
    if (entity.updatedAt !== undefined)
      updates.updatedAt = entity.updatedAt;

    const response = await this.dbClient.models.Debt.update(updates);
    if (!response.data) {
      throw new Error('Failed to update Debt: response.data is null');
    }
    return this.toDebt(response.data);
  }

  async delete(id: string): Promise<void> {
    await this.dbClient.models.Debt.delete({ debtId: id });
  }

  async findByOrganization(organizationId: string): Promise<DebtEntity[]> {
    const response = await this.dbClient.models.Debt.listDebtByOrganizationId({
      organizationId,
    });
    return response.data.map((item: any) => this.toDebt(item));
  }

  async findActiveByOrganization(organizationId: string): Promise<DebtEntity[]> {
    const allDebts = await this.findByOrganization(organizationId);
    return allDebts.filter((debt: any) => debt.status === 'active');
  }

  async findByFinancialAccount(
    financialAccountId: string
  ): Promise<DebtEntity | null> {
    // Note: This requires filtering - may want to add GSI in future
    const allDebts = await this.findAll();
    const found = allDebts.find(
      (debt: any) => debt.financialAccountId === financialAccountId
    );
    return found ?? null;
  }

  /**
   * Convert Amplify Debt entity to DebtEntity
   */
  private toDebt(data: any): DebtEntity {
    return {
      debtId: data.debtId,
      organizationId: data.organizationId,
      financialAccountId: data.financialAccountId ?? undefined,
      name: data.name,
      type: data.type,
      originalBalance: data.originalBalance,
      currentBalance: data.currentBalance,
      interestRate: data.interestRate ?? undefined,
      minimumPayment: data.minimumPayment ?? undefined,
      dueDate: data.dueDate ?? undefined,
      status: data.status,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      profileOwner: data.profileOwner ?? undefined,
    };
  }
}
