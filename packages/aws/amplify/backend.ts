import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import {postConfirmation} from "./auth/post-confirmation/resource";
import {nueInkApiFunction} from "./functions/nueink-api/resource";
import {createEventBus} from "./events/resource";
import {Policy, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  RestApi
} from 'aws-cdk-lib/aws-apigateway';
import {Stack} from "aws-cdk-lib";

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  postConfirmation,
  nueInkApiFunction
});

// create a new API stack
const apiStack = backend.createStack("nueink-api-stack");

// create EventBridge event bus
const eventBus = createEventBus(apiStack);

// create a new REST API
const nueInkRestApi = new RestApi(apiStack, "RestApi", {
  restApiName: "nueInkRestApi",
  deploy: true,
  deployOptions: {
    stageName: "dev",
  },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS, // Restrict this to domains you trust
    allowMethods: Cors.ALL_METHODS, // Specify only the methods you need to allow
    allowHeaders: Cors.DEFAULT_HEADERS, // Specify only the headers you need to allow
  },
});

// create a new Lambda integration
const lambdaIntegration = new LambdaIntegration(
    backend.nueInkApiFunction.resources.lambda
);

const rootPath = nueInkRestApi.root;

// add methods proxy handler and lambda integration
rootPath.addProxy({
  anyMethod: true,
  defaultIntegration: lambdaIntegration,
});

// create a new Cognito User Pools authorizer
const cognitoAuth = new CognitoUserPoolsAuthorizer(apiStack, "CognitoAuth", {
  cognitoUserPools: [backend.auth.resources.userPool],
});

// create a new resource path with Cognito authorization
const booksPath = nueInkRestApi.root.addResource("cognito-auth-path");
booksPath.addMethod("GET", lambdaIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuth,
});

// create a new IAM policy to allow Invoke access to the API
const apiRestPolicy = new Policy(apiStack, "RestApiPolicy", {
  statements: [
    new PolicyStatement({
      actions: ["execute-api:Invoke"],
      resources: [
        `${nueInkRestApi.arnForExecuteApi("*", "/", "dev")}`,
        `${nueInkRestApi.arnForExecuteApi("*", "/*", "dev")}`,
        `${nueInkRestApi.arnForExecuteApi("*", "/items", "dev")}`,
        `${nueInkRestApi.arnForExecuteApi("*", "/items/*", "dev")}`,
        `${nueInkRestApi.arnForExecuteApi("*", "/cognito-auth-path", "dev")}`,
      ],
    }),
  ],
});

// attach the policy to the authenticated and unauthenticated IAM roles
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
    apiRestPolicy
);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(
    apiRestPolicy
);

// add outputs to the configuration file
backend.addOutput({
  custom: {
    API: {
      [nueInkRestApi.restApiName]: {
        endpoint: nueInkRestApi.url,
        region: Stack.of(nueInkRestApi).region,
        apiName: nueInkRestApi.restApiName,
      },
    },
  },
});
