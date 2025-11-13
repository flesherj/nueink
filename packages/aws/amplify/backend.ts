import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { postConfirmation } from './auth/post-confirmation/resource';
import { financialConnect } from './functions/financial/connect/resource';
import { financialSync } from './functions/financial/sync/resource';
import { createEventBus } from './events/resource';
import { HttpApi, HttpMethod, CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Duration } from 'aws-cdk-lib';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  postConfirmation,
  financialConnect,
  financialSync,
});

// Create stack for custom resources (EventBridge, future Lambdas, etc.)
const eventsStack = backend.createStack('nueink-events-stack');

// Create EventBridge event bus for sync orchestration
const eventBus = createEventBus(eventsStack);

// ========== Financial Sync Schedule ==========

/**
 * Create EventBridge rule to trigger financial sync Lambda
 * Schedule: Every 4 hours (6 times per day)
 *
 * This keeps financial data reasonably fresh while staying within
 * API rate limits and minimizing costs.
 */
const syncStack = backend.createStack('nueink-sync-stack');

new Rule(syncStack, 'FinancialSyncSchedule', {
  ruleName: 'nueink-financial-sync-schedule',
  description: 'Triggers financial data sync every 4 hours',
  schedule: Schedule.rate(Duration.hours(4)), // Run every 4 hours
  targets: [new LambdaFunction(backend.financialSync.resources.lambda)],
});

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
    allowMethods: [CorsHttpMethod.GET],
    allowHeaders: ['*'],
  },
});

// Create Lambda integration for financial-connect function
const financialConnectIntegration = new HttpLambdaIntegration(
  'FinancialConnectIntegration',
  backend.financialConnect.resources.lambda
);

// Add GET /oauth/callback route
httpApi.addRoutes({
  path: '/oauth/callback',
  methods: [HttpMethod.GET],
  integration: financialConnectIntegration,
});

// Output the API URL for configuration
// This will be visible in CloudFormation outputs
oauthStack.exportValue(httpApi.url!, {
  name: 'OAuthCallbackUrl',
  description: 'OAuth callback URL for YNAB/Plaid redirect_uri configuration',
});
