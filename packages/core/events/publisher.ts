import { EventBridgeClient, PutEventsCommand, PutEventsRequestEntry } from '@aws-sdk/client-eventbridge';
import { v4 as uuidv4 } from 'uuid';
import { NueInkEvent, NueInkEventType } from './types';

/**
 * Event to be published
 */
export interface PublishEvent<T = unknown> {
  eventType: NueInkEventType;
  source: string;
  organizationId: string;
  correlationId: string;
  data: T;
  accountId?: string;
  metadata?: Record<string, any>;
}

/**
 * Converter function type that transforms NueInkEvent to EventBridge entry format
 */
export type EventConverter = <T>(
  event: NueInkEvent<T>,
  eventBusName: string
) => PutEventsRequestEntry;

/**
 * Default event converter for AWS EventBridge
 */
export const defaultEventConverter: EventConverter = <T>(event: NueInkEvent<T>, eventBusName: string) => ({
  EventBusName: eventBusName,
  Source: event.source,
  DetailType: event.eventType,
  Detail: JSON.stringify(event),
  Time: new Date(event.timestamp),
});

/**
 * Event Publisher for NueInk
 * Publishes events to EventBridge for event-driven architecture
 */
export class NueInkEventPublisher {
  private static instance: NueInkEventPublisher;
  private client: EventBridgeClient;
  private eventBusName: string;
  private converter: EventConverter;

  private constructor(
    client: EventBridgeClient = new EventBridgeClient({}),
    eventBusName: string = 'nueink-events',
    converter: EventConverter = defaultEventConverter
  ) {
    this.client = client;
    this.eventBusName = eventBusName;
    this.converter = converter;
  }

  /**
   * Get singleton instance
   * @param client - EventBridgeClient instance (optional, defaults to new client)
   * @param eventBusName - Event bus name (optional, defaults to 'nueink-events')
   * @param converter - Event converter function (optional, defaults to defaultEventConverter)
   */
  public static getInstance = (
    client?: EventBridgeClient,
    eventBusName?: string,
    converter?: EventConverter
  ): NueInkEventPublisher => {
    if (!NueInkEventPublisher.instance) {
      NueInkEventPublisher.instance = new NueInkEventPublisher(client, eventBusName, converter);
    }
    return NueInkEventPublisher.instance;
  };

  /**
   * Reset singleton (useful for testing)
   */
  public static resetInstance = (): void => {
    NueInkEventPublisher.instance = undefined as any;
  };

  /**
   * Publish a single event to EventBridge
   */
  public publish = async <T>(event: PublishEvent<T>): Promise<void> => {
    await this.publishBatch([event]);
  };

  /**
   * Publish multiple events in a batch
   */
  public publishBatch = async <T>(events: PublishEvent<T>[]): Promise<void> => {
    const entries = events.map(event => {
      const nueinkEvent = this.enrichEvent(event);
      return this.converter(nueinkEvent, this.eventBusName);
    });

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
  };

  /**
   * Enrich PublishEvent with generated fields to create NueInkEvent
   */
  private enrichEvent = <T>(event: PublishEvent<T>): NueInkEvent<T> => ({
    eventId: uuidv4(),
    timestamp: new Date().toISOString(),
    ...event,
  });
}
