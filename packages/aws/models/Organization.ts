export enum OrganizationStatus {
  Active = 'active',
  Inactive = 'inactive',
  Disabled = 'disabled',
}

export enum OrganizationType {
  Individual = 'individual',
  Family = 'family',
  Company = 'company',
  Enterprise = 'enterprise',
  Government = 'government',
  Educational = 'educational',
  NonProfit = 'nonprofit',
  Partner = 'partner',
  Sandbox = 'sandbox',
}

export type Organization = {
  orgId: string;
  name: string;
  type: string;
  parentOrgId: string;
  createdByAccountId: string;
  createdAt: Date;
  status: OrganizationStatus;
};
