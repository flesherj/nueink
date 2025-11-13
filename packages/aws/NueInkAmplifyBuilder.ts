import { parseAmplifyConfig } from 'aws-amplify/utils';
import amplifyOutputs from './amplify_outputs.json';
import { LibraryOptions, ResourcesConfig } from '@aws-amplify/core';
import { Amplify } from 'aws-amplify';

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

    // Note: REST API support was removed when nueink-api-stack was deprecated
    // This code is kept for backward compatibility but won't activate without custom.API
    if (this.apiSupport) {
      const customOutputs = amplifyOutputs as any;
      if (customOutputs.custom?.API) {
        config = {
          ...this.amplifyConfig,
          API: {
            ...this.amplifyConfig.API,
            REST: customOutputs.custom.API,
          },
        };

        options = {
          ...this.libraryOptions,
          API: { REST: { retryStrategy: { strategy: 'no-retry' } } },
        };
      }
    }

    Amplify.configure(config, options);
  };
}
