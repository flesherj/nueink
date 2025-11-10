import { del, get, post } from 'aws-amplify/api';

export class AwsAmplifyApiFactory {
  private static _instance: AwsAmplifyApiFactory;
  private _apiConfig = {
    apiName: 'nueInkRestApi',
    options: {
      retryStrategy: {
        strategy: 'no-retry', // Overrides default retry strategy
      },
    },
  } as const;

  public static getInstance() {
    if (!this._instance) {
      this._instance = new AwsAmplifyApiFactory();
    }

    return this._instance;
  }

  public get = (path: string) => {
    return get({ ...this._apiConfig, path });
  };

  public post = (path: string) => {
    return post({ ...this._apiConfig, path });
  };

  public del = (path: string) => {
    return del({ ...this._apiConfig, path });
  };
}
