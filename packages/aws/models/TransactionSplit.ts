export type TransactionSplitEntity = {
  splitId: string;
  transactionId: string; // FK to Transaction
  organizationId: string;
  category: string;
  amount: number; // In cents
  percentage?: number; // Optional percentage
  notes?: string; // Optional notes
  createdAt: string;
  updatedAt: string;
  profileOwner?: string;
};
