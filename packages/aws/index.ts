// ========================================
// CLIENT-SAFE EXPORTS (React Native / Web)
// ========================================
// These exports are safe for mobile/web apps and don't include AWS SDK dependencies

export * from './models';
export * from './NueInkAmplifyBuilder';
export { ClientRepositoryFactory } from './repositories/ClientRepositoryFactory';

// ========================================
// LAMBDA-ONLY EXPORTS (DO NOT USE IN REACT NATIVE)
// ========================================
// Lambda functions must import these directly:
// - import { NueInkRepositoryFactory } from '@nueink/aws/repositories'
// - import { SecretsManagerService } from '@nueink/aws/services'
// - import { EventBridgePublisher } from '@nueink/aws/events/EventBridgePublisher'

// DO NOT uncomment these or they will break React Native builds:
// export * from './services';  // ← Contains AWS SDK dependencies
// export * from './repositories';  // ← Contains AWS SDK dependencies
// export * from './events';  // ← Contains AWS SDK dependencies
