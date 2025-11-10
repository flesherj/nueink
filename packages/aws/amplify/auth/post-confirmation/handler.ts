import type { PostConfirmationTriggerHandler } from 'aws-lambda';
import { env } from '$amplify/env/post-confirmation';
import { NueInkRepositoryFactory } from '@nueink/aws';
import { initializeAmplifyClient } from '../../shared/initializeClient';

const client = await initializeAmplifyClient(env);

export const handler: PostConfirmationTriggerHandler = async (event) => {
  console.log('PostConfirmationTriggerHandler ', event);

  const factory = NueInkRepositoryFactory.getInstance(client);
  const accountService = factory.repository('account');
  const organizationService = factory.repository('organization');
  const membershipService = factory.repository('membership');

  const provider = event.request.userAttributes.identities
    ? JSON.parse(event.request.userAttributes.identities)[0].providerName
    : 'NueInk';
  const firstName = event.request.userAttributes.given_name;
  const lastName = event.request.userAttributes.family_name;
  const username = event.userName;
  const accountId = event.request.userAttributes.sub;
  const email = event.request.userAttributes.email;
  const profileOwner = `${accountId}::${username}`;

  console.log('creating account ');

  const account = await accountService.create(
    provider,
    email,
    username,
    accountId,
    profileOwner,
    undefined,
    firstName,
    undefined,
    lastName
  );
  console.log('Account created', account);

  const possibleOrgName = `${firstName ?? ''} ${lastName ?? ''}`.trim();
  const orgName = possibleOrgName.length > 0 ? possibleOrgName : username;

  console.log('creating organization');

  const organization = await organizationService.create(
    orgName,
    'individual',
    accountId,
    profileOwner,
    account.defaultOrgId
  );
  console.log('organization created', organization);

  console.log('creating membership');

  const membership = await membershipService.create(
    accountId,
    organization.orgId,
    'owner',
    profileOwner
  );

  console.log('membership created', membership);

  return event;
};
