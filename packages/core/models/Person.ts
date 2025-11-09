/**
 * Person domain model
 * Represents a person for transaction assignment (e.g., Sarah, James, Shared)
 */
export interface Person {
  personId: string;
  organizationId: string;
  name: string;
  color?: string;                  // Hex color for UI
  avatarUrl?: string;
  sortOrder?: number;
  createdAt: Date;
  profileOwner: string;
}
