import { AccountStatus } from './types';

export type AccountEntity = {
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
  meta: {
    onboardCompleted: boolean;
  };
  profileOwner?: string;
};
