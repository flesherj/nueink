import { OrganizationStatus, OrganizationType } from './types';

export type OrganizationEntity = {
  orgId: string;
  name: string;
  type: OrganizationType;
  parentOrgId: string;
  createdByAccountId: string;
  createdAt: Date;
  status: OrganizationStatus;
  profileOwner?: string;
};
