import { EventBus } from 'aws-cdk-lib/aws-events';
import { Stack } from 'aws-cdk-lib';

/**
 * Creates the NueInk event bus for event-driven architecture
 *
 * CDK auto-generates a unique name to avoid conflicts when multiple
 * sandboxes run in the same AWS account
 *
 * @param stack - The nested stack for events resources
 */
export const createEventBus = (stack: Stack): EventBus => {
  // Let CDK auto-generate the event bus name
  // This ensures uniqueness when multiple developers use same AWS account
  // Lambda will receive the actual name via environment variable
  return new EventBus(stack, 'NueInkEventBus');
};
