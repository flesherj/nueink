/**
 * Comment domain model
 * Represents a comment on a transaction
 */
export interface Comment {
  commentId: string;
  transactionId: string;
  accountId: string;               // Who commented
  organizationId: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
  profileOwner: string;
}
