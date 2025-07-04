import {type ClientSchema, a, defineData} from '@aws-amplify/backend';
import {postConfirmation} from '../auth/post-confirmation/resource';

const schema = a.schema({
    User: a.model({
        id: a.id(),
        username: a.string(),
        email: a.string(),
        name: a.string(),
        firstName: a.string(),
        middleName: a.string(),
        lastName: a.string(),
        provider: a.string(),
        createdAt: a.datetime(),
        lastLogin: a.datetime(),
        profileOwner: a.string(),
        onboardCompleted: a.boolean(),
    }).authorization((allow) => [
        allow.ownerDefinedIn("profileOwner"),
    ])
}).authorization((allow) => [allow.resource(postConfirmation)]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
    schema,
    authorizationModes: {
        defaultAuthorizationMode: "apiKey",
        apiKeyAuthorizationMode: {
            expiresInDays: 30,
        },
    },
});
