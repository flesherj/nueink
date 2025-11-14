import type { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { env } from '$amplify/env/financial-connect';
import { NueInkRepositoryFactory } from '@nueink/aws';
import { CloudWatchMetricsService, SecretsManagerService } from '@nueink/aws/services';
import { EventBridgePublisher } from '@nueink/aws/events/EventBridgePublisher';
import {
  IntegrationConfigService,
  STANDARD_DIMENSIONS,
  type FinancialProvider,
  FINANCIAL_PROVIDERS,
  FinancialOAuthService
} from '@nueink/core';
import { YnabOAuthProvider } from '@nueink/ynab';
import { PlaidOAuthProvider } from '@nueink/plaid';
import { initializeAmplifyClient } from '../../../shared/initializeClient';
import { Environment } from './Environment';

const client = await initializeAmplifyClient(env);
const metrics = new CloudWatchMetricsService();
const eventPublisher = new EventBridgePublisher(Environment.eventBusName);

// Initialize OAuth service with configured providers
const oauthService = new FinancialOAuthService();

oauthService.registerProvider('ynab', new YnabOAuthProvider({
  tokenUrl: env.YNAB_TOKEN_URL,
  clientId: env.YNAB_CLIENT_ID,
  clientSecret: env.YNAB_CLIENT_SECRET,
  redirectUri: env.YNAB_REDIRECT_URI,
}));

oauthService.registerProvider('plaid', new PlaidOAuthProvider({
  clientId: env.PLAID_CLIENT_ID,
  secret: env.PLAID_SECRET,
  environment: env.PLAID_ENVIRONMENT as 'sandbox' | 'development' | 'production',
}));

// ========== Response Helpers ==========

/**
 * Create error response (DRY helper)
 */
const errorResponse = (
  statusCode: number,
  error: string,
  message: string
): APIGatewayProxyResult => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ error, message }),
});

/**
 * Create redirect response (DRY helper)
 */
const redirectResponse = (location: string): APIGatewayProxyResult => ({
  statusCode: 302,
  headers: { Location: location },
  body: '',
});

/**
 * Validate provider is a supported FinancialProvider
 */
const validateProvider = (provider: string): FinancialProvider | null => {
  if (FINANCIAL_PROVIDERS.includes(provider as FinancialProvider)) {
    return provider as FinancialProvider;
  }
  return null;
};

/**
 * OAuth Callback Handler
 *
 * Handles OAuth callbacks from financial providers (YNAB, Plaid, etc.)
 *
 * Flow:
 * 1. Receive authorization code from provider
 * 2. Exchange code for access token + refresh token
 * 3. Store tokens in AWS Secrets Manager
 * 4. Create/update IntegrationConfig in DynamoDB
 * 5. Redirect user back to app
 *
 * Query parameters:
 * - code: Authorization code from provider
 * - state: Custom state (format: {accountId}:{provider}:{organizationId})
 * - error: Error from provider (if authorization failed)
 */
export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('OAuth Callback Handler', JSON.stringify(event, null, 2));
  const startTime = Date.now();

  try {
    const queryParams = event.queryStringParameters || {};
    const { code, state, error: providerError } = queryParams;

    // Handle error from provider
    if (providerError) {
      console.error('OAuth error from provider:', providerError);
      metrics.record('OAUTH_CALLBACK_FAILURE', 1, {
        ErrorType: 'ProviderError',
        Status: STANDARD_DIMENSIONS.STATUS.FAILURE,
      }, { error: providerError });

      return errorResponse(400, 'oauth_error', `Provider returned error: ${providerError}`);
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('Missing required parameters:', { code: !!code, state: !!state });
      metrics.record('OAUTH_CALLBACK_FAILURE', 1, {
        ErrorType: 'MissingParameters',
        Status: STANDARD_DIMENSIONS.STATUS.FAILURE,
      });

      return errorResponse(400, 'invalid_request', 'Missing required parameters: code and state');
    }

    // Parse and validate state: {accountId}:{provider}:{organizationId}
    const [accountId, providerString, organizationId] = state.split(':');
    if (!accountId || !providerString || !organizationId) {
      console.error('Invalid state format:', state);
      metrics.record('OAUTH_CALLBACK_FAILURE', 1, {
        ErrorType: 'InvalidState',
        Status: STANDARD_DIMENSIONS.STATUS.FAILURE,
      });

      return errorResponse(400, 'invalid_state', 'Invalid state parameter format');
    }

    // Validate provider type once
    const provider = validateProvider(providerString);
    if (!provider) {
      console.error('Unsupported provider:', providerString);
      metrics.record('OAUTH_CALLBACK_FAILURE', 1, {
        ErrorType: 'UnsupportedProvider',
        Status: STANDARD_DIMENSIONS.STATUS.FAILURE,
      });

      return errorResponse(400, 'unsupported_provider', `Provider '${providerString}' is not supported`);
    }

    // Initialize services
    const factory = NueInkRepositoryFactory.getInstance(client);
    const integrationConfigRepository = factory.repository('integrationConfig');
    const secretManager = new SecretsManagerService();
    const integrationConfigService = new IntegrationConfigService(
      integrationConfigRepository,
      secretManager
    );

    // Exchange code for tokens using core OAuth service
    // (providers were configured with their specific configs during registration)
    const tokens = await oauthService.exchangeAuthorizationCode(provider, code);

    // Store tokens in Secrets Manager
    await integrationConfigService.storeTokens(accountId, provider, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    });

    // Check if integration config already exists
    const existingConfig = await integrationConfigService.findByAccountIdAndProvider(
      accountId,
      provider
    );

    if (existingConfig) {
      // Update existing integration
      await integrationConfigService.update(existingConfig.integrationId, {
        status: 'active',
        expiresAt: tokens.expiresAt,
        syncEnabled: true,
        lastSyncError: undefined, // Clear any previous errors
      });
    } else {
      // Create new integration config
      await integrationConfigService.create({
        integrationId: `${accountId}-${provider}-${Date.now()}`,
        accountId,
        organizationId,
        provider,
        status: 'active',
        expiresAt: tokens.expiresAt,
        syncEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profileOwner: accountId, // Assuming accountId is the Cognito user ID
      });
    }

    const durationMs = Date.now() - startTime;

    // Record success metrics
    metrics.record('OAUTH_CALLBACK_SUCCESS', 1, {
      UserId: accountId,
      Provider: provider,
      Status: STANDARD_DIMENSIONS.STATUS.SUCCESS,
    });

    metrics.record('OAUTH_CALLBACK_DURATION', durationMs, {
      UserId: accountId,
      Provider: provider,
    });

    // Publish event to trigger immediate sync
    try {
      await eventPublisher.publish({
        Source: 'nueink.financial',
        DetailType: 'IntegrationConnected',
        Detail: JSON.stringify({
          integrations: [{
            accountId,
            provider,
          }],
        }),
      });
      console.log(`Published IntegrationConnected event for ${accountId}/${provider}`);
    } catch (error) {
      // Don't fail the OAuth callback if event publishing fails
      console.error('Failed to publish IntegrationConnected event:', error);

      metrics.record('INTEGRATION_SYNC_TRIGGER_FAILURE', 1, {
        UserId: accountId,
        Provider: provider,
        Status: STANDARD_DIMENSIONS.STATUS.FAILURE,
      });
    }

    // Redirect back to app with success (using nueink:// scheme from app.json)
    return redirectResponse(`nueink://oauth-success?provider=${provider}`);
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('OAuth callback error:', errorMessage, error);

    metrics.record('OAUTH_CALLBACK_FAILURE', 1, {
      ErrorType: 'Unknown',
      Status: STANDARD_DIMENSIONS.STATUS.FAILURE,
    }, { error: errorMessage });

    return errorResponse(500, 'server_error', 'Failed to process OAuth callback');
  }
};

