import {defineAuth, secret} from '@aws-amplify/backend';

export const Secrets = {
    SIWA_TEAM_ID: 'SIWA_TEAM_ID',           // WDJ36R5M2D
    SIWA_PRIVATE_KEY: 'SIWA_PRIVATE_KEY',   // AuthKey_NQM57RX58Z.p8
    SIWA_KEY_ID: 'SIWA_KEY_ID',             // NQM57RX58Z
    SIWA_CLIENT_ID: 'SIWA_CLIENT_ID',       // com.nueink.native.sid
};

const verificationEmailBody = (createCode:() => string) => {
    return `Your NueInk verification code is ${createCode()}`;
}

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
    loginWith: {
        email: {
            userInvitation: {
                emailSubject: 'Welcome to Nueink',
            },
            verificationEmailSubject: 'Verify your email for Nueink',
            verificationEmailBody,
            verificationEmailStyle: 'CODE'
        },
        externalProviders: {
            callbackUrls: ['http://localhost:8081/', 'https://app.nueink.com/', 'nueink://login'],
            logoutUrls: ['http://localhost:8081/', 'https://app.nueink.com/', 'nueink://logout'],
            signInWithApple: {
                keyId: secret(Secrets.SIWA_KEY_ID),
                clientId: secret(Secrets.SIWA_CLIENT_ID),
                privateKey: secret(Secrets.SIWA_PRIVATE_KEY),
                teamId: secret(Secrets.SIWA_TEAM_ID),
                scopes: ['email', 'name'],
                attributeMapping: {
                    email: 'email',
                    givenName: 'name.firstName',
                    familyName: 'name.lastName',
                    fullname: 'name.firstName'
                }
            }
        }
    },
});
