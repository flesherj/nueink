/**
 * MetricsService interface for platform-agnostic metrics tracking
 *
 * Implementations:
 * - CloudWatchMetricsService (Lambda) - @nueink/aws
 * - AmplitudeMetricsService (Mobile) - Future
 * - WebMetricsService (Web) - Future
 *
 * Architecture:
 * - Static dimensions (Platform, Environment) set in constructor
 * - Session dimensions (SessionId) set per-session via setSessionId()
 * - User properties (UserId, cohort, etc.) set per-user via setUserProperties()
 * - Context dimensions (Screen, Feature) set per-screen via setContext()
 * - Metric dimensions passed to record() call
 *
 * Usage:
 * ```typescript
 * // Initialize (once)
 * const metrics: MetricsService = new CloudWatchMetricsService();
 *
 * // Set session (on app open / new session)
 * metrics.setSessionId(uuid());
 *
 * // Set user context (on login)
 * metrics.setUserProperties({
 *   userId: user.id,
 *   signupDate: user.createdAt,
 *   hasPartner: user.organizationMemberCount > 1
 * });
 *
 * // Set screen context (on navigation)
 * metrics.setContext({ screen: 'TransactionDetail', feature: 'Comments' });
 *
 * // Record metric
 * metrics.record('COMMENT_POSTED', 1, {
 *   UserId: user.id,
 *   FeedItemType: 'transaction'
 * });
 * // Automatically includes: Platform, Environment, SessionId, Screen, Feature
 * ```
 */

import type {
  MetricKey,
  MetricDimensionsObject,
} from '../config/metrics';

/**
 * User properties for segmentation and analysis
 */
export interface UserProperties {
  userId: string;
  signupDate?: string;
  cohort?: string;  // e.g., "2025-11-W1" for week-based cohorts
  hasPartner?: boolean;
  integrationsCount?: number;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Context for current screen/feature
 */
export interface MetricContext {
  screen?: string;
  feature?: string;
  flow?: string;  // User journey (e.g., "ViewTransaction", "CreateBudget")
}

/**
 * Operation tracking helper
 */
export interface Operation {
  /**
   * Mark operation as successful
   * Records *_COMPLETED metric with duration
   */
  succeed(metadata?: Record<string, any>): void;

  /**
   * Mark operation as failed
   * Records *_FAILED metric with duration and error details
   */
  fail(error: Error | string): void;
}

/**
 * Platform-agnostic metrics service
 */
export interface MetricsService {
  /**
   * Record a metric with type-safe dimensions
   *
   * @param metricKey - Metric key from METRIC_DEFINITIONS
   * @param value - Metric value (count, duration, etc.)
   * @param dimensions - Metric-specific dimensions (type-checked)
   * @param metadata - Additional context (not indexed, for debugging)
   *
   * @example
   * ```typescript
   * metrics.record('USER_SIGNUP', 1, {
   *   Provider: 'Google',
   *   EmailDomain: 'gmail.com',
   *   Status: 'success'
   * });
   * ```
   */
  record<K extends MetricKey>(
    metricKey: K,
    value: number,
    dimensions: MetricDimensionsObject<K>,
    metadata?: Record<string, any>
  ): Promise<void> | void;

  /**
   * Record multiple metrics in a batch
   * Useful for reducing overhead when recording many metrics
   *
   * @param metrics - Array of metric records
   *
   * @example
   * ```typescript
   * metrics.recordBatch([
   *   { key: 'SCREEN_VIEWED', value: 1, dimensions: { UserId: 'u1', Screen: 'Feed' } },
   *   { key: 'FEATURE_USED', value: 1, dimensions: { UserId: 'u1', Feature: 'Comments' } }
   * ]);
   * ```
   */
  recordBatch(
    metrics: Array<{
      key: MetricKey;
      value: number;
      dimensions: Record<string, string>;
      metadata?: Record<string, any>;
    }>
  ): Promise<void> | void;

  /**
   * Set session ID for current session
   * Auto-added to all subsequent metrics until changed
   *
   * Call this:
   * - On app open (new session)
   * - After long inactivity (session timeout)
   *
   * @param sessionId - Unique session identifier
   *
   * @example
   * ```typescript
   * const sessionId = uuid();
   * metrics.setSessionId(sessionId);
   * ```
   */
  setSessionId(sessionId: string): void;

  /**
   * Set user properties for segmentation
   * Auto-added as metadata to all subsequent metrics
   *
   * Call this:
   * - On user login
   * - When user properties change (e.g., connects partner)
   *
   * @param properties - User properties
   *
   * @example
   * ```typescript
   * metrics.setUserProperties({
   *   userId: user.id,
   *   signupDate: user.createdAt,
   *   cohort: '2025-11-W1',
   *   hasPartner: true
   * });
   * ```
   */
  setUserProperties(properties: UserProperties): void;

  /**
   * Set context for current screen/feature
   * Auto-added as dimensions to all subsequent metrics
   *
   * Call this:
   * - On screen navigation
   * - When entering/exiting a feature
   *
   * @param context - Screen/feature context
   *
   * @example
   * ```typescript
   * // On navigation
   * metrics.setContext({
   *   screen: 'TransactionDetail',
   *   feature: 'Comments',
   *   flow: 'ViewTransaction'
   * });
   *
   * // Clear context
   * metrics.setContext({});
   * ```
   */
  setContext(context: MetricContext): void;

  /**
   * Start tracking an operation
   * Returns Operation helper that records start/end/duration
   *
   * Automatically records:
   * - On succeed(): *_COMPLETED (count), *_DURATION (milliseconds)
   * - On fail(): *_FAILED (count), *_DURATION (milliseconds), ErrorType
   *
   * @param operation - Operation name (e.g., 'sync', 'upload', 'load_feed')
   * @param dimensions - Operation-specific dimensions
   * @returns Operation helper
   *
   * @example
   * ```typescript
   * const op = metrics.startOperation('sync', {
   *   UserId: user.id,
   *   Provider: 'ynab'
   * });
   *
   * try {
   *   await syncData();
   *   op.succeed({ transactionCount: 50 });
   * } catch (error) {
   *   op.fail(error);
   * }
   * ```
   */
  startOperation(
    operation: string,
    dimensions: Record<string, string>
  ): Operation;
}
