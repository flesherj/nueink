export type TransactionSplitEntity = {
  splitId: string;
  transactionId: string; // FK to Transaction
  organizationId: string;
  category: string;
  amount: number; // In cents
  percentage?: number; // Optional percentage
  aiGenerated?: boolean; // True if AI created this split
  confidence?: number; // AI confidence 0-100
  notes?: string; // Optional notes
  createdAt: string;
  updatedAt: string;
  profileOwner?: string;
};
