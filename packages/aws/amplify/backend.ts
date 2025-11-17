import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { postConfirmation } from './auth/post-confirmation/resource';
import { financialConnect } from './functions/financial/connect/resource';
import { financialSync } from './functions/financial/sync/resource';
import { nueInkApi } from './functions/api/resource';
import { createEventBus } from './events/resource';
import { HttpApi, HttpMethod, CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import {
  RestApi,
  LambdaIntegration,
  Cors,
} from 'aws-cdk-lib/aws-apigateway';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Duration, Stack } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  postConfirmation,
  financialConnect,
  financialSync,
  nueInkApi,
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

// Grant financial-sync Lambda permission to invoke Bedrock for AI categorization
// Needs wildcard region since inference profiles can route to different regions
backend.financialSync.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['bedrock:InvokeModel'],
    resources: [
      `arn:aws:bedrock:*::foundation-model/*`,
      `arn:aws:bedrock:*:${iamStack.account}:inference-profile/*`,
    ],
  })
);

// Create stack for custom resources (EventBridge, future Lambdas, etc.)
const eventsStack = backend.createStack('nueink-events-stack');

// Create EventBridge event bus for sync orchestration
// CDK auto-generates unique name to support multiple sandboxes in same AWS account
const eventBus = createEventBus(eventsStack);

// Pass the event bus name to financial Lambdas via environment variable
// Using 'as any' to access underlying Lambda's addEnvironment method
(backend.financialConnect.resources.lambda as any).addEnvironment('EVENT_BUS_NAME', eventBus.eventBusName);

// ========== Financial Sync Schedule ==========

/**
 * Create EventBridge rule to trigger financial sync Lambda
 * Schedule: Every 4 hours (6 times per day)
 *
 * This keeps financial data reasonably fresh while staying within
 * API rate limits and minimizing costs.
 */
const syncStack = backend.createStack('nueink-sync-stack');

// EventBridge rules - Ultra-short construct IDs let CDK auto-generate names under 64 chars
new Rule(syncStack, 'Sch', {
  description: 'Triggers financial data sync every 4 hours',
  schedule: Schedule.rate(Duration.hours(4)),
  targets: [new LambdaFunction(backend.financialSync.resources.lambda)],
});

new Rule(syncStack, 'Con', {
  description: 'Triggers immediate sync when user connects a financial provider',
  eventBus: eventBus,
  eventPattern: {
    source: ['nueink.financial'],
    detailType: ['IntegrationConnected'],
  },
  targets: [new LambdaFunction(backend.financialSync.resources.lambda)],
});

new Rule(syncStack, 'Man', {
  description: 'Triggers sync when user manually requests it from UI',
  eventBus: eventBus,
  eventPattern: {
    source: ['nueink.financial.manual'],
    detailType: ['ManualSyncTriggered'],
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
  description: 'HTTP API for OAuth callbacks from financial providers',
  corsPreflight: {
    allowOrigins: ['*'],
    allowMethods: [CorsHttpMethod.GET],
    allowHeaders: ['*'],
  },
});

// Create Lambda integration for OAuth callback
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

// ========== REST API for Client Operations ==========

/**
 * Create REST API Gateway for all client-side operations
 * Replaces direct AppSync access from clients
 *
 * Endpoints:
 * - GET /account/:accountId - Get account
 * - GET /account - List accounts
 * - GET /integration/:accountId - List integrations
 * - POST /integration/:accountId/sync - Trigger sync
 */
const apiStack = backend.createStack('nueink-rest-api-stack');

// Extract sandbox identifier for resource naming
const apiStackSuffix = apiStack.stackName.split('-').slice(-1)[0] || 'default';

// Create REST API
const restApi = new RestApi(apiStack, 'NueInkRestApi', {
  restApiName: `nueink-api-${apiStackSuffix}`,
  description: 'REST API for NueInk client applications',
  deploy: true,
  deployOptions: {
    stageName: 'dev',
  },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS,
    allowMethods: Cors.ALL_METHODS,
    allowHeaders: Cors.DEFAULT_HEADERS,
  },
});

// Create Lambda integration
const apiLambdaIntegration = new LambdaIntegration(backend.nueInkApi.resources.lambda);

// Add proxy route (/* catches all paths)
restApi.root.addProxy({
  anyMethod: true,
  defaultIntegration: apiLambdaIntegration,
});

// Note: Cognito authorizer can be added later when needed for protected routes
// Example:
// const cognitoAuth = new CognitoUserPoolsAuthorizer(apiStack, 'CognitoAuth', {
//   cognitoUserPools: [backend.auth.resources.userPool],
// });
// const protectedPath = restApi.root.addResource('protected');
// protectedPath.addMethod('GET', apiLambdaIntegration, {
//   authorizationType: AuthorizationType.COGNITO,
//   authorizer: cognitoAuth,
// });

// Grant API invoke permissions to authenticated/unauthenticated users
const apiPolicy = new iam.Policy(apiStack, 'RestApiPolicy', {
  statements: [
    new iam.PolicyStatement({
      actions: ['execute-api:Invoke'],
      resources: [
        `${restApi.arnForExecuteApi('*', '/*', 'dev')}`,
      ],
    }),
  ],
});

backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(apiPolicy);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(apiPolicy);

// Grant nueInk API Lambda permission to publish events
backend.nueInkApi.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['events:PutEvents'],
    resources: [`arn:aws:events:${apiStack.region}:${apiStack.account}:event-bus/*`],
  })
);

// Grant nueInk API Lambda permission to read SSM parameters
backend.nueInkApi.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['ssm:GetParameter', 'ssm:GetParameters'],
    resources: [`arn:aws:ssm:${apiStack.region}:${apiStack.account}:parameter/amplify/*`],
  })
);

// Grant nueInk API Lambda permission to manage Secrets Manager
backend.nueInkApi.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: [
      'secretsmanager:GetSecretValue',
      'secretsmanager:PutSecretValue',
      'secretsmanager:UpdateSecret',
      'secretsmanager:DescribeSecret',
    ],
    resources: [`arn:aws:secretsmanager:${apiStack.region}:${apiStack.account}:secret:nueink/integration/*`],
  })
);

// Grant nueInk API Lambda permission to publish CloudWatch metrics
backend.nueInkApi.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['cloudwatch:PutMetricData'],
    resources: ['*'],
  })
);

// Pass event bus name to API Lambda
(backend.nueInkApi.resources.lambda as any).addEnvironment('EVENT_BUS_NAME', eventBus.eventBusName);

// Add REST API URL to outputs
backend.addOutput({
  custom: {
    API: {
      [restApi.restApiName]: {
        endpoint: restApi.url,
        region: Stack.of(restApi).region,
        apiName: restApi.restApiName,
      },
    },
  },
});
