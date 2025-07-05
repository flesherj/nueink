import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../amplify/data/resource';
import { Membership, MembershipRole, MembershipStatus } from '../models';

export class MembershipService {
  constructor(private dbClient = generateClient<Schema>()) {}

  public create = async (
    accountId: string,
    orgId: string,
    role: MembershipRole,
    profileOwner: string,
    status: MembershipStatus = MembershipStatus.Active
  ) => {
    const response = await this.dbClient.models.Membership.create({
      accountId: accountId,
      orgId: orgId,
      role: role,
      status: status,
      joinedAt: new Date().toISOString(),
      profileOwner: profileOwner,
    });

    console.log('Created Membership: ', response);
    return response.data as unknown as Membership;
  };
}
