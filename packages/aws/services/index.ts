/**
 * AWS Services - Lambda ONLY
 *
 * DO NOT import in React Native code.
 *
 * AwsServiceFactory: Factory for creating AWS infrastructure service instances
 * CloudWatchMetricsService: Uses CloudWatch EMF (Embedded Metric Format)
 * SecretsManagerService: Manages OAuth tokens in AWS Secrets Manager
 * BedrockAIInsightProvider: AWS Bedrock implementation of AIInsightProvider
 *
 * For mobile/web: Create platform-specific implementations
 */
export * from './AwsServiceFactory';
export * from './CloudWatchMetricsService';
export * from './SecretsManagerService';
export * from './BedrockAIInsightProvider';
