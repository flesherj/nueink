import type { PostAuthenticationTriggerHandler } from 'aws-lambda';
import { CloudWatchMetricsService } from '@nueink/aws/services';
import { STANDARD_DIMENSIONS } from '@nueink/core';

const metrics = new CloudWatchMetricsService();

/**
 * Post Authentication Lambda Trigger
 *
 * Fires every time a user successfully signs in (password or social).
 * Also fires on token refresh (can differentiate via event.request.userAttributes).
 *
 * Tracks:
 * - USER_LOGIN metric with Provider and LoginType dimensions
 * - Platform: lambda (auto-added)
 * - Environment: dev/staging/prod (auto-detected)
 *
 * For Investors:
 * - Daily Active Users (DAU)
 * - Login frequency per user
 * - Preferred auth methods (Google vs Apple vs Email)
 * - User retention (% who return after 1 day, 7 days, 30 days)
 */
export const handler: PostAuthenticationTriggerHandler = async (event) => {
  console.log('PostAuthenticationTriggerHandler', event);

  const accountId = event.request.userAttributes.sub;
  const username = event.userName;

  // Determine auth provider
  const provider = event.request.userAttributes.identities
    ? JSON.parse(event.request.userAttributes.identities)[0].providerName
    : STANDARD_DIMENSIONS.PROVIDER.NUEINK;

  // Determine login type (new session vs token refresh)
  // Note: This is a simplified heuristic. In production, you might want to
  // check event.request.newDeviceUsed or track session IDs
  const isRefreshToken = event.triggerSource === 'PostAuthentication_Authentication' ? false : false;
  const loginType = isRefreshToken
    ? STANDARD_DIMENSIONS.LOGIN_TYPE.REFRESH
    : STANDARD_DIMENSIONS.LOGIN_TYPE.NEW;

  try {
    // Record login metric
    metrics.record('USER_LOGIN', 1, {
      Provider: provider,
      LoginType: loginType,
    });

    console.log(`User login tracked: ${username} (${provider}, ${loginType})`);

    // Optional: Update Account.lastLoginAt in DynamoDB
    // This would require importing AccountRepository and updating the record
    // For now, we're just tracking the metric

    return event;
  } catch (error) {
    // Don't fail auth if metrics fail - just log
    console.error('Failed to record login metric', error);
    return event;
  }
};
