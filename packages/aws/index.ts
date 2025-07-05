import { Amplify } from 'aws-amplify';
import { LibraryOptions, ResourcesConfig } from '@aws-amplify/core';
import { generateClient } from 'aws-amplify/api';
import {
  AmplifyOutputsUnknown,
  LegacyConfig,
} from '@aws-amplify/core/internals/utils';

import {
  AccountService,
  OrganizationService,
  MembershipService,
} from './services';
import type { Schema } from './amplify/data/resource';
import { AccountApi } from './api';

export class NueInkAmplify {
  private readonly client;
  public readonly accounts: AccountService;
  public readonly organizations: OrganizationService;
  public readonly memberships: MembershipService;
  public readonly accountApi: AccountApi;

  constructor(
    resourceConfig: ResourcesConfig | LegacyConfig | AmplifyOutputsUnknown,
    libraryOptions?: LibraryOptions
  ) {
    Amplify.configure(resourceConfig, libraryOptions);
    this.client = generateClient<Schema>();
    this.accounts = new AccountService(this.client);
    this.organizations = new OrganizationService(this.client);
    this.memberships = new MembershipService(this.client);
    this.accountApi = new AccountApi();
  }
}
