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
import * as iam from 'aws-cdk-lib/aws-iam';
import { deriveShortIdFromStackName } from './shared/sandbox-utils';

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

// ========== Grant IAM Permissions to Financial Lambdas ==========

// Create a dedicated stack for IAM permissions
const iamStack = backend.createStack('nueink-iam-stack');

// Grant financial-connect Lambda permission to read SSM parameters and manage Secrets Manager
backend.financialConnect.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['ssm:GetParameter', 'ssm:GetParameters'],
    resources: [`arn:aws:ssm:${iamStack.region}:${iamStack.account}:parameter/amplify/*`],
  })
);

backend.financialConnect.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: [
      'secretsmanager:CreateSecret',
      'secretsmanager:GetSecretValue',
      'secretsmanager:PutSecretValue',
      'secretsmanager:UpdateSecret',
      'secretsmanager:DescribeSecret',
      'secretsmanager:TagResource',
    ],
    resources: [`arn:aws:secretsmanager:${iamStack.region}:${iamStack.account}:secret:nueink/integration/*`],
  })
);

backend.financialConnect.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['events:PutEvents'],
    resources: [`arn:aws:events:${iamStack.region}:${iamStack.account}:event-bus/*`],
  })
);

// Grant financial-sync Lambda permission to read SSM parameters and manage Secrets Manager
backend.financialSync.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['ssm:GetParameter', 'ssm:GetParameters'],
    resources: [`arn:aws:ssm:${iamStack.region}:${iamStack.account}:parameter/amplify/*`],
  })
);

backend.financialSync.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: [
      'secretsmanager:GetSecretValue',
      'secretsmanager:PutSecretValue',
      'secretsmanager:UpdateSecret',
      'secretsmanager:DescribeSecret',
    ],
    resources: [`arn:aws:secretsmanager:${iamStack.region}:${iamStack.account}:secret:nueink/integration/*`],
  })
);

// Create stack for custom resources (EventBridge, future Lambdas, etc.)
const eventsStack = backend.createStack('nueink-events-stack');

// Create EventBridge event bus for sync orchestration
// Bus name will be: nueink-events-{sandboxId} (e.g., nueink-events-dev-sandbox-371f35b233)
// Lambdas can derive this from their function name at runtime
// Pass the parent stack name to extract the sandbox ID
const eventBus = createEventBus(eventsStack, backend.stack.stackName);

// ========== Financial Sync Schedule ==========

/**
 * Create EventBridge rule to trigger financial sync Lambda
 * Schedule: Every 4 hours (6 times per day)
 *
 * This keeps financial data reasonably fresh while staying within
 * API rate limits and minimizing costs.
 */
const syncStack = backend.createStack('nueink-sync-stack');

// EventBridge rules have a 64-character name limit
// CDK's Rule construct ignores ruleName when stack names are long
// So we use minimal construct IDs and let CDK auto-generate physical names

new Rule(syncStack, 'Sch', {
  description: 'Triggers financial data sync every 4 hours',
  schedule: Schedule.rate(Duration.hours(4)), // Run every 4 hours
  targets: [new LambdaFunction(backend.financialSync.resources.lambda)],
});

// Create rule to trigger sync when new integration is connected
new Rule(syncStack, 'Con', {
  description: 'Triggers immediate sync when user connects a financial provider',
  eventBus: eventBus,
  eventPattern: {
    source: ['nueink.financial'],
    detailType: ['IntegrationConnected'],
  },
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
const oauthStack = backend.createStack('nueink-oauth-api-stack');

// Extract sandbox identifier from stack name for resource namespacing
const stackSuffix = oauthStack.stackName.split('-').slice(-1)[0] || 'default';

const httpApi = new HttpApi(oauthStack, 'OAuthHttpApi', {
  apiName: `nueink-oauth-api-${stackSuffix}`,
  description: 'HTTP API for OAuth callbacks from financial providers (YNAB, Plaid)',
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
// This will be visible in CloudFormation outputs AND in amplify_outputs.json
oauthStack.exportValue(httpApi.url!, {
  name: 'OAuthCallbackUrl',
  description: 'OAuth callback URL for YNAB/Plaid redirect_uri configuration',
});

// Add OAuth callback URL to amplify_outputs.json
// This allows the mobile app to access the callback URL without hardcoding
backend.addOutput({
  custom: {
    oauthCallbackUrl: `${httpApi.url!}oauth/callback`,
  },
});
