export type SplitData = {
  category: string;
  percentage: number;
  confidence?: number;
};

export type UserCategorizationFeedbackEntity = {
  feedbackId: string;
  transactionId: string; // FK to Transaction
  organizationId: string; // FK to Organization
  accountId: string; // FK to Account (who made the correction)
  merchantName?: string; // Merchant name from transaction
  amount: number; // Transaction amount in cents

  // Original AI categorization
  originalSplits: SplitData[]; // Array of {category, percentage, confidence}

  // User's corrected categorization
  correctedSplits: SplitData[]; // Array of {category, percentage}

  // Metadata
  feedbackType: string; // manual_edit|quick_accept|quick_reject
  createdAt: string;
  profileOwner?: string;
};
