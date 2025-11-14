import { EventBus } from 'aws-cdk-lib/aws-events';
import { Stack } from 'aws-cdk-lib';

/**
 * Creates the NueInk event bus for event-driven architecture
 *
 * Event bus name includes stack ID to allow multiple sandboxes to coexist
 */
export const createEventBus = (stack: Stack): EventBus => {
  // Extract a unique suffix from the stack name to namespace the event bus
  // This allows multiple sandboxes (dev, jamesflesher, etc.) to run simultaneously
  const stackSuffix = stack.stackName.split('-').slice(-1)[0] || 'default';

  return new EventBus(stack, 'NueInkEventBus', {
    eventBusName: `nueink-events-${stackSuffix}`,
  });
};
