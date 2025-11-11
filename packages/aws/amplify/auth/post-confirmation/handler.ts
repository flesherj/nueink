import type { PostConfirmationTriggerHandler } from 'aws-lambda';
import { env } from '$amplify/env/post-confirmation';
import { NueInkRepositoryFactory, CloudWatchMetricsService } from '@nueink/aws';
import { STANDARD_DIMENSIONS } from '@nueink/core';
import { initializeAmplifyClient } from '../../shared/initializeClient';

const client = await initializeAmplifyClient(env);
const metrics = new CloudWatchMetricsService();

export const handler: PostConfirmationTriggerHandler = async (event) => {
  console.log('PostConfirmationTriggerHandler ', event);
  const startTime = Date.now();

  const factory = NueInkRepositoryFactory.getInstance(client);
  const accountService = factory.repository('account');
  const organizationService = factory.repository('organization');
  const membershipService = factory.repository('membership');

  const provider = event.request.userAttributes.identities
    ? JSON.parse(event.request.userAttributes.identities)[0].providerName
    : STANDARD_DIMENSIONS.PROVIDER.NUEINK;
  const firstName = event.request.userAttributes.given_name;
  const lastName = event.request.userAttributes.family_name;
  const username = event.userName;
  const accountId = event.request.userAttributes.sub;
  const email = event.request.userAttributes.email;
  const profileOwner = `${accountId}::${username}`;
  const emailDomain = email?.split('@')[1] || 'unknown';

  try {
    console.log('creating account');

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

    // Record successful signup metrics
    const duration = Date.now() - startTime;

    metrics.record('USER_SIGNUP', 1, {
      Provider: provider,
      EmailDomain: emailDomain,
      Status: STANDARD_DIMENSIONS.STATUS.SUCCESS,
    });

    metrics.record('SIGNUP_DURATION', duration, {
      Provider: provider,
    });

    return event;
  } catch (error) {
    // Record signup failure metrics
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    metrics.record('SIGNUP_FAILURE', 1, {
      Provider: provider,
      ErrorType: CloudWatchMetricsService.categorizeError(errorMessage),
    });

    metrics.record('SIGNUP_DURATION', duration, {
      Provider: provider,
    });

    console.error('Signup failed', error);

    // Re-throw so Cognito knows it failed
    throw error;
  }
};
