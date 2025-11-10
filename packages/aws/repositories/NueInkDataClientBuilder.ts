import { generateClient } from 'aws-amplify/api';
import { Schema } from '../amplify/data/resource';

export class NueInkDataClientBuilder {
  public static builder = () => new NueInkDataClientBuilder();

  public build = () => {
    return generateClient<Schema>();
  };
}
