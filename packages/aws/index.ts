import { Amplify } from 'aws-amplify';
import { LibraryOptions, ResourcesConfig } from '@aws-amplify/core';
import { generateClient } from 'aws-amplify/api';

import {
  AccountService,
  OrganizationService,
  MembershipService,
} from './services';
import type { Schema } from './amplify/data/resource';

export class NueInkAmplify {
  private readonly client;
  public readonly accounts: AccountService;
  public readonly organizations: OrganizationService;
  public readonly memberships: MembershipService;

  constructor(
    resourceConfig: ResourcesConfig,
    libraryOptions?: LibraryOptions
  ) {
    Amplify.configure(resourceConfig, libraryOptions);
    this.client = generateClient<Schema>();
    this.accounts = new AccountService(this.client);
    this.organizations = new OrganizationService(this.client);
    this.memberships = new MembershipService(this.client);
  }
}
