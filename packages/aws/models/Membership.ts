export enum MembershipStatus {
  Active = 'active',
  Invited = 'invited',
  Pending = 'pending',
}

export enum MembershipRole {
  Owner = 'owner',
  Admin = 'admin',
  Member = 'member',
  Parent = 'parent',
  Child = 'child',
}

export type Membership = {
  accountId: string;
  orgId: string;
  role: MembershipRole;
  status: MembershipStatus;
  joinedAt: Date;
};
