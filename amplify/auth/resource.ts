import {defineAuth, secret} from '@aws-amplify/backend';

export const Secrets = {
  SIWA_TEAM_ID: 'SIWA_TEAM_ID',           // WDJ36R5M2D
  SIWA_PRIVATE_KEY: 'SIWA_PRIVATE_KEY',   // AuthKey_NQM57RX58Z.p8
  SIWA_KEY_ID: 'SIWA_KEY_ID',             // NQM57RX58Z
  SIWA_CLIENT_ID: 'SIWA_CLIENT_ID',       // com.nueink.native.sid
};

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      callbackUrls: ['http://localhost:8081/', 'https://app.nueink.com/'],
      logoutUrls: ['http://localhost:8081/logout', 'https://app.nueink.com/logout'],
      signInWithApple: {
        keyId: secret(Secrets.SIWA_KEY_ID),
        clientId: secret(Secrets.SIWA_CLIENT_ID),
        privateKey: secret(Secrets.SIWA_PRIVATE_KEY),
        teamId: secret(Secrets.SIWA_TEAM_ID),
      }
    }
  },
});
