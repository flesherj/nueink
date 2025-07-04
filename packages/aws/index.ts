import { Amplify } from 'aws-amplify';
import { LibraryOptions, ResourcesConfig } from '@aws-amplify/core';
import { generateClient } from 'aws-amplify/api';
import { UserService } from './services/UserService';
import type { Schema } from './amplify/data/resource';

export class NueInkAmplify {
  private readonly client;
  public readonly users: UserService;

  constructor(
    resourceConfig: ResourcesConfig,
    libraryOptions?: LibraryOptions
  ) {
    Amplify.configure(resourceConfig, libraryOptions);
    this.client = generateClient<Schema>();
    this.users = new UserService(this.client);
  }
}
