import { v4 as uuidv4 } from 'uuid';
import { NueInkEvent, NueInkEventType } from './types';
import { PublishableEvent } from './EventPublisher';

/**
 * Event to be published (before enrichment)
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
 * Converter that transforms NueInk domain events to AWS EventBridge format
 */
export class EventBridgeConverter {
  /**
   * Convert a PublishEvent to NueInkEvent (enrichment)
   */
  public enrichEvent = <T>(event: PublishEvent<T>): NueInkEvent<T> => {
    return {
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      ...event,
    };
  };

  /**
   * Convert NueInkEvent to platform-agnostic publishable event format
   */
  public toPublishableEvent = <T>(event: NueInkEvent<T>, eventBusName?: string): PublishableEvent => {
    return {
      eventBusName,
      source: event.source,
      detailType: event.eventType,
      detail: JSON.stringify(event),
    };
  };

  /**
   * Convenience method: enrich and convert in one step
   */
  public convert = <T>(event: PublishEvent<T>, eventBusName?: string): PublishableEvent => {
    const enrichedEvent = this.enrichEvent(event);
    return this.toPublishableEvent(enrichedEvent, eventBusName);
  };

  /**
   * Convert multiple events
   */
  public convertBatch = <T>(events: PublishEvent<T>[], eventBusName?: string): PublishableEvent[] => {
    return events.map(event => this.convert(event, eventBusName));
  };
}
