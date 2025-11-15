import { EventPublisher } from './EventPublisher';
import { EventBridgeConverter, PublishEvent } from './EventBridgeConverter';

/**
 * NueInk Event Service
 * Provides a domain-level API for publishing events
 * Handles conversion from domain events to infrastructure events
 */
export class NueInkEventService {
  private converter: EventBridgeConverter;

  constructor(
    private publisher: EventPublisher,
    private eventBusName?: string
  ) {
    this.converter = new EventBridgeConverter();
  }

  /**
   * Publish a single domain event
   */
  public publish = async <T>(event: PublishEvent<T>): Promise<void> => {
    const ebEvent = this.converter.convert(event, this.eventBusName);
    await this.publisher.publish(ebEvent);
  };

  /**
   * Publish multiple domain events in a batch
   */
  public publishBatch = async <T>(events: PublishEvent<T>[]): Promise<void> => {
    const ebEvents = this.converter.convertBatch(events, this.eventBusName);
    await this.publisher.publishBatch(ebEvents);
  };
}
