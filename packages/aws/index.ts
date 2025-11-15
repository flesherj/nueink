// ========================================
// CLIENT-SAFE EXPORTS (React Native / Web)
// ========================================
// These exports are safe for mobile/web apps and don't include AWS SDK dependencies

export * from './models';
export * from './NueInkAmplifyBuilder';
export * from './repositories';  // Safe - uses Amplify Data client (GraphQL), not AWS SDK

// ========================================
// LAMBDA-ONLY EXPORTS (DO NOT USE IN REACT NATIVE)
// ========================================
// Lambda functions can import these directly if needed:
// - import { AwsServiceFactory } from '@nueink/aws/services'
// - import { SecretsManagerService } from '@nueink/aws/services'
// - import { EventBridgePublisher } from '@nueink/aws/events/EventBridgePublisher'

// DO NOT uncomment - contains AWS SDK dependencies:
// export * from './services';  // ← AwsServiceFactory, SecretsManagerService, CloudWatchMetricsService use AWS SDK
// export * from './events';  // ← EventBridgePublisher uses AWS SDK
