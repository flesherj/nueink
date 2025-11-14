import Constants from 'expo-constants';

export type OAuthConfig = {
  ynab: {
    clientId: string;
    authUrl: string;
  };
  plaid: {
    clientId: string;
    environment: 'sandbox' | 'development' | 'production';
  };
  callbackUrl: string;
};

export type EnvironmentConfig = {
  oauth: OAuthConfig;
};

/**
 * Environment configuration loaded from build-time environment variables
 * These values are injected during the build process via env.config.sh
 * @see app.config.ts - injects process.env into extra.env
 * @see ../env.config.sh - loads secrets from AWS
 */
const Environment: EnvironmentConfig = {
  oauth: {
    ynab: {
      clientId: Constants.expoConfig?.extra?.env?.YNAB_CLIENT_ID || '',
      authUrl: Constants.expoConfig?.extra?.env?.YNAB_AUTH_URL || 'https://app.ynab.com/oauth/authorize',
    },
    plaid: {
      clientId: Constants.expoConfig?.extra?.env?.PLAID_CLIENT_ID || '',
      environment: (Constants.expoConfig?.extra?.env?.PLAID_ENVIRONMENT || 'sandbox') as 'sandbox' | 'development' | 'production',
    },
    callbackUrl: Constants.expoConfig?.extra?.env?.OAUTH_CALLBACK_URL || '',
  },
};

export default Environment;
