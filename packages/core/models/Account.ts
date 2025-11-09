import { AccountStatus } from './types';

/**
 * Account domain model
 * Represents a user account
 */
export interface Account {
  accountId: string;
  defaultOrgId: string;
  email: string;
  username: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  provider: string;
  createdAt: Date;
  status: AccountStatus;
  meta?: {
    onboardCompleted?: boolean;
  };
  profileOwner: string;
}
