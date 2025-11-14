import { EventBus } from 'aws-cdk-lib/aws-events';
import { Stack } from 'aws-cdk-lib';
import { deriveSandboxIdFromStackName } from '../shared/sandbox-utils';

/**
 * Creates the NueInk event bus for event-driven architecture
 *
 * Event bus name includes sandbox ID to allow multiple sandboxes to coexist
 *
 * @param stack - The nested stack for events resources
 * @param parentStackName - The parent stack name containing the sandbox ID
 */
export const createEventBus = (stack: Stack, parentStackName: string): EventBus => {
  // Extract sandbox ID from parent stack name for predictable naming
  // Example: amplify-nueinkaws-dev-sandbox-371f35b233 → dev-sandbox-371f35b233
  const sandboxId = deriveSandboxIdFromStackName(parentStackName);

  return new EventBus(stack, 'NueInkEventBus', {
    eventBusName: `nueink-events-${sandboxId}`,
  });
};
