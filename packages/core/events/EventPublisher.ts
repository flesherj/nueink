/**
 * Generic event structure for publishing
 * Platform-agnostic representation of an event
 */
export interface PublishableEvent {
  source: string;
  detailType: string;
  detail: string;  // JSON string
  eventBusName?: string;
}

/**
 * Event Publisher interface
 * Abstraction for publishing events to various event systems
 * (EventBridge, SNS, in-memory queue, etc.)
 */
export interface EventPublisher {
  /**
   * Publish a single event
   */
  publish(event: PublishableEvent): Promise<void>;

  /**
   * Publish multiple events in a batch
   */
  publishBatch(events: PublishableEvent[]): Promise<void>;
}
