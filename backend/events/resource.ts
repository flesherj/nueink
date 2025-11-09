import { EventBus } from 'aws-cdk-lib/aws-events';
import { Stack } from 'aws-cdk-lib';

/**
 * Creates the NueInk event bus for event-driven architecture
 */
export const createEventBus = (stack: Stack): EventBus => {
  return new EventBus(stack, 'NueInkEventBus', {
    eventBusName: 'nueink-events',
  });
};
