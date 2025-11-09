import { DebtType, DebtStatus } from './types';

export type DebtEntity = {
  debtId: string;
  organizationId: string;
  financialAccountId?: string; // FK to FinancialAccount (if linked)
  name: string;
  type: DebtType;
  originalBalance: number;
  currentBalance: number;
  interestRate?: number; // APR as decimal (e.g., 0.0499 for 4.99%)
  minimumPayment?: number;
  dueDate?: number; // Day of month (1-31)
  status: DebtStatus;
  createdAt: Date;
  updatedAt: Date;
  profileOwner?: string;
};
