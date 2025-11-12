/**
 * AWS Services - Lambda ONLY
 *
 * DO NOT import in React Native code.
 *
 * CloudWatchMetricsService: Uses CloudWatch EMF (Embedded Metric Format)
 * SecretsManagerService: Manages OAuth tokens in AWS Secrets Manager
 *
 * For mobile/web: Create platform-specific implementations
 */
export * from './CloudWatchMetricsService';
export * from './SecretsManagerService';
