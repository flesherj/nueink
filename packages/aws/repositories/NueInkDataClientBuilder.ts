import { generateClient } from 'aws-amplify/api';
import type { V6Client } from '@aws-amplify/api-graphql';
import { Schema } from '../amplify/data/resource';

export class NueInkDataClientBuilder {
  public static builder = () => new NueInkDataClientBuilder();

  public build = (): V6Client<Schema> => {
    return generateClient<Schema>();
  };
}
