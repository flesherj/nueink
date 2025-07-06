import { generateClient } from 'aws-amplify/api';
import type { Schema } from './amplify/data/resource';

export class NueInkDataClientBuilder {
  public static builder = () => new NueInkDataClientBuilder();

  public build = () => {
    return generateClient<Schema>();
  };
}
