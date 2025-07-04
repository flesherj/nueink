export type User = {
  id: string;
  username: string;
  email: string;
  name?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  provider: string;
  createdAt: Date;
  lastLogin: Date;
  profileOwner: string;
  onboardCompleted: boolean;
};
