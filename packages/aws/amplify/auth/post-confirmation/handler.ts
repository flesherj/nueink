import type {PostConfirmationTriggerHandler} from "aws-lambda";
import {getAmplifyDataClientConfig} from '@aws-amplify/backend/function/runtime';
import {env} from "$amplify/env/post-confirmation";

import {NueInkAmplifyBuilder, NueInkServiceFactory, MembershipRole, OrganizationType} from "../../..";

const {resourceConfig, libraryOptions} = await getAmplifyDataClientConfig(env);

NueInkAmplifyBuilder.builder().withResourceConfig(resourceConfig).withLibraryOptions(libraryOptions).build();

export const handler: PostConfirmationTriggerHandler = async (event) => {
    console.log('PostConfirmationTriggerHandler', event);

    const accountService = NueInkServiceFactory.getInstance().accountService();
    const organizationService = NueInkServiceFactory.getInstance().organizationService();
    const membershipService = NueInkServiceFactory.getInstance().membershipService();

    const provider = event.request.userAttributes.identities ? JSON.parse(event.request.userAttributes.identities)[0].providerName : 'NueInk';
    const firstName = event.request.userAttributes.given_name;
    const lastName = event.request.userAttributes.family_name;
    const username = event.userName;
    const accountId = event.request.userAttributes.sub;
    const profileOwner = `${accountId}::${username}`

    const account = await accountService.create(provider, event.request.userAttributes.email, username, accountId, profileOwner, undefined, firstName, undefined, lastName);

    const possibleOrgName = `${firstName ?? ''} ${lastName ?? ''}`.trim();
    const orgName = possibleOrgName.length > 0 ? possibleOrgName : username;
    const organization = await organizationService.create(orgName, OrganizationType.Individual, accountId, profileOwner, account.defaultOrgId);

    await membershipService.create(accountId, organization.orgId, MembershipRole.Owner, profileOwner);

    return event;
};
