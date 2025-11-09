import { MembershipRole, MembershipStatus } from './types';

/**
 * Membership domain model
 * Represents the relationship between an account and an organization
 */
export interface Membership {
  accountId: string;
  orgId: string;
  role: MembershipRole;
  status: MembershipStatus;
  joinedAt: Date;
  profileOwner: string;
}
