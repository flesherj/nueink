import type { PostConfirmationTriggerHandler } from "aws-lambda";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from "$amplify/env/post-confirmation";

import {NueInkAmplify} from "../../../index";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
    env
);

const nueInk = new NueInkAmplify(resourceConfig, libraryOptions);

export const handler: PostConfirmationTriggerHandler = async (event) => {
    console.log('PostConfirmationTriggerHandler', event);
    await nueInk.users.create({
        id: event.request.userAttributes.sub,
        username: event.userName,
        email: event.request.userAttributes.email,
        name: event.request.userAttributes.name,
        firstName: event.request.userAttributes.given_name,
        lastName: event.request.userAttributes.family_name,
        provider: event.request.userAttributes.identities ? JSON.parse(event.request.userAttributes.identities)[0].providerName : 'NueInk',
        createdAt: new Date(),
        lastLogin: new Date(),
        profileOwner: `${event.request.userAttributes.sub}::${event.userName}`,
        onboardCompleted: false,
    });

    return event;
};
