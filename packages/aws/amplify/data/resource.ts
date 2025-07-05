import {type ClientSchema, a, defineData} from '@aws-amplify/backend';
import {postConfirmation} from '../auth/post-confirmation/resource';

const schema = a.schema({
        Account: a.model({
            accountId: a.id().required(),             // PK
            defaultOrgId: a.string().required(),
            email: a.string().required(),          // GSI(1)
            username: a.string().required(),       // GSI(2)
            firstName: a.string(),
            middleName: a.string(),
            lastName: a.string(),
            provider: a.string().required(),       // Tracks Account Auth Origin
            createdAt: a.datetime().required(),    // Date / Time the account was created
            status: a.string().required(),
            contact: a.ref('Contact'),
            profileOwner: a.string(),
            meta: a.customType({
                onboardCompleted: a.boolean()
            }),
        })
            .identifier(['accountId'])
            .authorization((allow) => [allow.ownerDefinedIn("profileOwner")])
            .secondaryIndexes(index => [index('email'), index('username')]),
        Organization: a.model({
            orgId: a.id().required(),
            name: a.string().required(),
            type: a.string().required(),
            parentOrgId: a.string(),
            createdByAccountId: a.string().required(),
            createdAt: a.datetime().required(),
            status: a.string().required(),
            profileOwner: a.string(),
            contact: a.ref('Contact'),
        })
            .identifier(['orgId'])
            .authorization((allow) => [allow.ownerDefinedIn("profileOwner")])
            .secondaryIndexes(index => [index('parentOrgId'), index('name')]),

        Membership: a.model({
            accountId: a.id().required(),
            orgId: a.id().required(),
            role: a.string().required(),
            status: a.string().required(),
            joinedAt: a.datetime().required(),
            profileOwner: a.string(),
        })
            .identifier(['accountId', 'orgId'])
            .authorization((allow) => [allow.ownerDefinedIn("profileOwner")])
            .secondaryIndexes(index => [index('orgId')]),
        Contact: a.customType({
            addresses: a.ref('Address').array(),
            phones: a.ref('Phone').array(),
            emails: a.ref('Email').array(),
            websites: a.ref('Website').array(),
        }),
        Address: a.customType({
            type: a.string(),
            line1: a.string(),
            line2: a.string(),
            city: a.string(),
            state: a.string(),
            zip: a.string(),
            country: a.string(),
        }),
        Phone: a.customType({
            type: a.string(),
            number: a.string(),
        }),
        Email: a.customType({
            type: a.string(),
            address: a.string(),
        }),
        Website: a.customType({
            type: a.string(),
            url: a.string(),
        })
    })
        .authorization((allow) => [allow.resource(postConfirmation)])
;

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
