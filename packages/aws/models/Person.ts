export type PersonEntity = {
  personId: string;
  organizationId: string;
  name: string; // Person name (e.g., "Sarah", "James", "Shared")
  color?: string; // Hex color for UI (e.g., "#FF5733")
  avatarUrl?: string; // S3 URL for avatar
  sortOrder?: number; // Display order
  createdAt: string;
  profileOwner?: string;
};
