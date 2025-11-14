import { deriveEventBusName } from '@nueink/core';

/**
 * Environment configuration for financial-connect Lambda
 * Centralizes all environment variable access with type safety
 * Values are computed once at module load time
 */
export const Environment = {
  /** EventBridge event bus name for publishing integration events */
  eventBusName: deriveEventBusName(),

  /** AWS region for service calls */
  region: process.env.AWS_REGION || 'us-east-1',
} as const;
