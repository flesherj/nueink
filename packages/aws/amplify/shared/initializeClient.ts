import { generateClient } from 'aws-amplify/data';
import { type Schema } from '../data/resource';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { NueInkAmplifyBuilder } from '@nueink/aws';
import type { AmplifyDataClient } from '@nueink/aws/repositories/types';

/**
 * Shared initialization helper for Lambda functions
 * Configures Amplify and returns a strongly-typed data client
 */
export const initializeAmplifyClient = async (env: any): Promise<AmplifyDataClient> => {
  const { resourceConfig, libraryOptions } =
    await getAmplifyDataClientConfig(env);

  NueInkAmplifyBuilder.builder()
    .withResourceConfig(resourceConfig)
    .withLibraryOptions(libraryOptions)
    .build();

  return generateClient<Schema>() as any as AmplifyDataClient;
};
