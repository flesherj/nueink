import { generateClient } from 'aws-amplify/data';
import { v4 as uuid } from 'uuid';

import { type Schema } from '../amplify/data/resource';
import { Account, AccountStatus } from '../models';

export class AccountService {
  constructor(private dbClient = generateClient<Schema>()) {}

  public create = async (
    provider: string,
    email: string,
    username: string,
    accountId: string,
    profileOwner: string,
    defaultOrgId: string = uuid(),
    firstName?: string,
    middleName?: string,
    lastName?: string
  ) => {
    const response = await this.dbClient.models.Account.create({
      accountId: accountId,
      defaultOrgId: defaultOrgId,
      email: email,
      username: username,
      firstName: firstName,
      middleName: middleName,
      lastName: lastName,
      provider: provider,
      createdAt: new Date().toISOString(),
      status: AccountStatus.Active,
      profileOwner: profileOwner,
    });

    console.log('Created Account: ', response);

    return response.data as unknown as Account;
  };
}
