import { generateClient } from 'aws-amplify/api';
import { v4 as uuid } from 'uuid';

import type { Schema } from '../amplify/data/resource';
import { Organization, OrganizationStatus, OrganizationType } from '../models';

export class OrganizationService {
  constructor(private dbClient = generateClient<Schema>()) {}

  public create = async (
    name: string,
    type: OrganizationType,
    createdByAccountId: string,
    profileOwner: string,
    orgId: string = uuid(),
    parentOrgId?: string
  ) => {
    const response = await this.dbClient.models.Organization.create({
      orgId: orgId,
      name: name,
      type: type,
      createdByAccountId: createdByAccountId,
      parentOrgId: parentOrgId,
      createdAt: new Date().toISOString(),
      status: OrganizationStatus.Active,
      profileOwner: profileOwner,
    });

    console.log('Created Organization: ', response);
    return response.data as unknown as Organization;
  };
}
