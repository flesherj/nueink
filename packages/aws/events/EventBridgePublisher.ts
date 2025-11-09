import { EventBridgeClient, PutEventsCommand, PutEventsRequestEntry } from '@aws-sdk/client-eventbridge';

/**
 * AWS EventBridge event publisher
 * Publishes events directly to EventBridge without knowledge of domain events
 */
export class EventBridgePublisher {
  private client: EventBridgeClient;
  private eventBusName: string;

  constructor(
    eventBusName: string = 'nueink-events',
    client?: EventBridgeClient
  ) {
    this.client = client || new EventBridgeClient({});
    this.eventBusName = eventBusName;
  }

  /**
   * Publish a single event to EventBridge
   */
  public async publish(event: PutEventsRequestEntry): Promise<void> {
    await this.publishBatch([event]);
  }

  /**
   * Publish multiple events in a batch
   */
  public async publishBatch(events: PutEventsRequestEntry[]): Promise<void> {
    // Set event bus name if not already set
    const entries = events.map(event => ({
      ...event,
      EventBusName: event.EventBusName || this.eventBusName,
    }));

    try {
      const command = new PutEventsCommand({ Entries: entries });
      const response = await this.client.send(command);

      if (response.FailedEntryCount && response.FailedEntryCount > 0) {
        console.error('Failed to publish batch events:', response.Entries);
        throw new Error(`Failed to publish ${response.FailedEntryCount} events`);
      }

      console.log(`Batch published: ${events.length} events`);
    } catch (error) {
      console.error('Error publishing batch events:', error);
      throw error;
    }
  }
}
