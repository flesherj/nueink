import type { PostConfirmationTriggerHandler } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from "$amplify/env/post-confirmation";

import { type Schema } from "../../data/resource";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
    env
);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

export const handler: PostConfirmationTriggerHandler = async (event) => {
    console.log('PostConfirmationTriggerHandler', event);
    await client.models.User.create({
        id: event.request.userAttributes.sub,
        username: event.userName,
        email: event.request.userAttributes.email,
        name: event.request.userAttributes.name,
        firstName: event.request.userAttributes.given_name,
        lastName: event.request.userAttributes.family_name,
        provider: event.request.userAttributes.identities ? JSON.parse(event.request.userAttributes.identities)[0].providerName : 'NueInk',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        profileOwner: `${event.request.userAttributes.sub}::${event.userName}`,
    });

    return event;
};
