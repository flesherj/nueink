/**
 * Base EventBridge event structure
 * All EventBridge events follow this pattern where the actual payload is in the detail field
 */
export interface EventBridgeEvent<TDetail = any> {
  version?: string;
  id?: string;
  'detail-type': string;
  source: string;
  account?: string;
  time?: string;
  region?: string;
  resources?: string[];
  detail: TDetail;
}

/**
 * Type guard to check if an event is an EventBridge event
 */
export const isEventBridgeEvent = (event: any): event is EventBridgeEvent => {
  return (
    event &&
    typeof event === 'object' &&
    'detail' in event &&
    'detail-type' in event &&
    'source' in event
  );
};

/**
 * Extract detail from event (handles both direct invocation and EventBridge)
 */
export const extractDetail = <TDetail>(
  event: TDetail | EventBridgeEvent<TDetail>
): TDetail => {
  return isEventBridgeEvent(event) ? event.detail : event;
};
