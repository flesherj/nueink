import {
  EventBridgeClient,
  PutEventsCommand,
  PutEventsRequestEntry,
} from '@aws-sdk/client-eventbridge';
import type { EventPublisher, PublishableEvent } from '@nueink/core';

/**
 * AWS EventBridge event publisher
 * Implements core EventPublisher interface using AWS EventBridge
 */
export class EventBridgePublisher implements EventPublisher {
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
   * Convert domain PublishableEvent to AWS PutEventsRequestEntry
   */
  private toAwsEvent = (event: PublishableEvent): PutEventsRequestEntry => {
    return {
      Source: event.source,
      DetailType: event.detailType,
      Detail: event.detail,
      EventBusName: event.eventBusName || this.eventBusName,
    };
  };

  /**
   * Publish a single event to EventBridge
   */
  public publish = async (event: PublishableEvent): Promise<void> => {
    await this.publishBatch([event]);
  };

  /**
   * Publish multiple events in a batch
   */
  public publishBatch = async (events: PublishableEvent[]): Promise<void> => {
    // Convert domain events to AWS events
    const awsEvents = events.map(this.toAwsEvent);

    try {
      const command = new PutEventsCommand({ Entries: awsEvents });
      const response = await this.client.send(command);

      if (response.FailedEntryCount && response.FailedEntryCount > 0) {
        console.error('Failed to publish batch events:', response.Entries);
        throw new Error(
          `Failed to publish ${response.FailedEntryCount} events`
        );
      }

      console.log(`Batch published: ${events.length} events`);
    } catch (error) {
      console.error('Error publishing batch events:', error);
      throw error;
    }
  };
}
