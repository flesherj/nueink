export type CommentEntity = {
  commentId: string;
  transactionId: string; // FK to Transaction
  accountId: string; // FK to Account (who commented)
  organizationId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  profileOwner?: string;
};
