import { Amplify } from 'aws-amplify';
import { LibraryOptions, ResourcesConfig } from '@aws-amplify/core';
import { generateClient } from 'aws-amplify/api';
import { parseAmplifyConfig } from 'aws-amplify/utils';

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
import amplifyOutputs from '../../packages/aws/amplify_outputs.json';

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

export class NueInkAmplifyBuilder {
  private amplifyConfig = parseAmplifyConfig(amplifyOutputs);
  private libraryOptions = {} as LibraryOptions;
  private apiSupport = false;

  public static builder = () => new NueInkAmplifyBuilder();

  public withApiSupport = () => {
    this.apiSupport = true;
    return this;
  };

  public withResourceConfig = (resourceConfig: ResourcesConfig) => {
    this.amplifyConfig = resourceConfig;
    return this;
  };

  public withLibraryOptions = (options: LibraryOptions) => {
    this.libraryOptions = options;
    return this;
  };

  public build = () => {
    let config = this.amplifyConfig;
    let options = this.libraryOptions;

    if (this.apiSupport) {
      config = {
        ...this.amplifyConfig,
        API: {
          ...this.amplifyConfig.API,
          REST: amplifyOutputs.custom.API,
        },
      };

      options = {
        ...this.libraryOptions,
        API: { REST: { retryStrategy: { strategy: 'no-retry' } } },
      };
    }

    Amplify.configure(config, options);
  };
}
