import { v4 as uuidv4 } from 'uuid';
import { NueInkEvent, NueInkEventType } from './types';

/**
 * AWS EventBridge event entry format (minimal type definition to avoid importing AWS SDK in core)
 */
export interface EventBridgeEntry {
  EventBusName?: string;
  Source: string;
  DetailType: string;
  Detail: string;
  Time?: Date;
}

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
  public enrichEvent<T>(event: PublishEvent<T>): NueInkEvent<T> {
    return {
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      ...event,
    };
  }

  /**
   * Convert NueInkEvent to AWS EventBridge entry format
   */
  public toEventBridgeEntry<T>(event: NueInkEvent<T>, eventBusName?: string): EventBridgeEntry {
    return {
      EventBusName: eventBusName,
      Source: event.source,
      DetailType: event.eventType,
      Detail: JSON.stringify(event),
      Time: new Date(event.timestamp),
    };
  }

  /**
   * Convenience method: enrich and convert in one step
   */
  public convert<T>(event: PublishEvent<T>, eventBusName?: string): EventBridgeEntry {
    const enrichedEvent = this.enrichEvent(event);
    return this.toEventBridgeEntry(enrichedEvent, eventBusName);
  }

  /**
   * Convert multiple events
   */
  public convertBatch<T>(events: PublishEvent<T>[], eventBusName?: string): EventBridgeEntry[] {
    return events.map(event => this.convert(event, eventBusName));
  }
}
