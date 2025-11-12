import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { postConfirmation } from './auth/post-confirmation/resource';
import { oauthCallback } from './functions/oauth-callback/resource';
import { createEventBus } from './events/resource';
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  postConfirmation,
  oauthCallback,
});

// Create stack for custom resources (EventBridge, future Lambdas, etc.)
const eventsStack = backend.createStack('nueink-events-stack');

// Create EventBridge event bus for sync orchestration
const eventBus = createEventBus(eventsStack);

// ========== HTTP API for OAuth Callback ==========

/**
 * Create HTTP API Gateway for OAuth callbacks
 * This provides a public HTTPS endpoint that external providers (YNAB, Plaid)
 * can redirect to after user authorization.
 *
 * Endpoint: https://{api-id}.execute-api.{region}.amazonaws.com/oauth/callback
 */
const oauthStack = backend.createStack('nueink-oauth-stack');

const httpApi = new HttpApi(oauthStack, 'OAuthHttpApi', {
  apiName: 'nueink-oauth-api',
  description: 'HTTP API for OAuth callbacks from financial providers',
  corsPreflight: {
    allowOrigins: ['*'],
    allowMethods: [HttpMethod.GET],
    allowHeaders: ['*'],
  },
});

// Create Lambda integration for oauth-callback function
const oauthIntegration = new HttpLambdaIntegration(
  'OAuthCallbackIntegration',
  backend.oauthCallback.resources.lambda
);

// Add GET /oauth/callback route
httpApi.addRoutes({
  path: '/oauth/callback',
  methods: [HttpMethod.GET],
  integration: oauthIntegration,
});

// Output the API URL for configuration
// This will be visible in CloudFormation outputs
oauthStack.exportValue(httpApi.url!, {
  name: 'OAuthCallbackUrl',
  description: 'OAuth callback URL for YNAB/Plaid redirect_uri configuration',
});
