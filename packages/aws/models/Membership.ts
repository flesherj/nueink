import { MembershipRole, MembershipStatus } from './types';

export type MembershipEntity = {
  accountId: string;
  orgId: string;
  role: MembershipRole;
  status: MembershipStatus;
  joinedAt: string;
  profileOwner?: string;
};
