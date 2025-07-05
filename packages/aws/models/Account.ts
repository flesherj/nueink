export enum AccountStatus {
  Active = 'active',
  Invited = 'invited',
  Disabled = 'disabled',
}

export type Account = {
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
  onboardingCompleted: boolean;
};
