import {defineAuth, secret} from '@aws-amplify/backend';
import {postConfirmation} from "./post-confirmation/resource";
import {postAuthentication} from "./post-authentication/resource";

export const Secrets = {
    SIWA_TEAM_ID: 'SIWA_TEAM_ID',
    SIWA_PRIVATE_KEY: 'SIWA_PRIVATE_KEY',
    SIWA_KEY_ID: 'SIWA_KEY_ID',
    SIWA_CLIENT_ID: 'SIWA_CLIENT_ID',
    GOOGLE_CLIENT_ID: 'GOOGLE_CLIENT_ID',
    GOOGLE_CLIENT_SECRET: 'GOOGLE_CLIENT_SECRET',
    AMAZON_CLIENT_ID: 'AMAZON_CLIENT_ID',
    AMAZON_CLIENT_SECRET: 'AMAZON_CLIENT_SECRET',
    FB_CLIENT_ID: 'FB_CLIENT_ID',
    FB_CLIENT_SECRET: 'FB_CLIENT_SECRET',
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
            facebook: {
                clientId: secret(Secrets.FB_CLIENT_ID),
                clientSecret: secret(Secrets.FB_CLIENT_SECRET),
                scopes: ['email', 'public_profile'],
                attributeMapping: {
                    email: 'email',
                    givenName: 'first_name',
                    familyName: 'last_name',
                    fullname: 'name',
                    profilePicture: 'picture'
                }
            },
            loginWithAmazon: {
                clientId: secret(Secrets.AMAZON_CLIENT_ID),
                clientSecret: secret(Secrets.AMAZON_CLIENT_SECRET),
                scopes: ['profile'],
            },
            google: {
                clientId: secret(Secrets.GOOGLE_CLIENT_ID),
                clientSecret: secret(Secrets.GOOGLE_CLIENT_SECRET),
                scopes: ['email', 'profile'],
                attributeMapping: {
                    email: 'email',
                    givenName: 'given_name',
                    familyName: 'family_name',
                    fullname: 'name',
                    profilePicture: 'picture'
                }
            },
            signInWithApple: {
                keyId: secret(Secrets.SIWA_KEY_ID),
                clientId: secret(Secrets.SIWA_CLIENT_ID),
                privateKey: secret(Secrets.SIWA_PRIVATE_KEY),
                teamId: secret(Secrets.SIWA_TEAM_ID),
                scopes: ['email', 'name'],
                attributeMapping: {
                    email: 'email'
                }
            }
        }
    },
    triggers: {
        postConfirmation,
        postAuthentication,
    },
});
