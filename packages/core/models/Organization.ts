import { OrganizationStatus, OrganizationType } from './types';

/**
 * Organization domain model
 * Represents a hierarchical organization (individual, family, company, etc.)
 */
export interface Organization {
  orgId: string;
  name: string;
  type: OrganizationType;
  parentOrgId?: string;
  createdByAccountId: string;
  createdAt: Date;
  status: OrganizationStatus;
  profileOwner: string;
}
