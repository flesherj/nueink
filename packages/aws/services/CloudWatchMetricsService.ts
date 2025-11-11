/**
 * CloudWatch Metrics Service using Embedded Metric Format (EMF)
 *
 * Implements MetricsService interface for Lambda environment.
 * Publishes metrics to CloudWatch via structured JSON logs.
 *
 * EMF Benefits:
 * - FREE metrics (extracted from logs automatically)
 * - No API calls (just console.log)
 * - Cost: ~$0.50/GB of logs vs $0.01 per PutMetricData call
 *
 * Architecture:
 * - Auto-detects environment (dev/staging/prod) from Amplify env vars
 * - Separate namespaces per environment (nueink-dev, nueink-prod)
 * - Auto-adds Platform='lambda' and Environment dimensions
 * - Tracks session, user properties, and context
 *
 * Usage:
 * ```typescript
 * const metrics = new CloudWatchMetricsService();
 * // Auto-detects: Platform='lambda', Environment='dev', Namespace='nueink-dev'
 *
 * metrics.record('SYNC_SUCCESS', 1, {
 *   UserId: 'user-123',
 *   Provider: 'ynab',
 *   Status: 'success'
 * });
 * ```
 *
 * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format_Specification.html
 */

import type {
  MetricsService,
  UserProperties,
  MetricContext,
  Operation,
} from '@nueink/core/services/MetricsService';
import {
  METRIC_DEFINITIONS,
  STANDARD_DIMENSIONS,
  type Environment,
  type MetricKey,
  type MetricDimensionsObject,
  type MetricUnit,
} from '@nueink/core/config/metrics';

/**
 * CloudWatch EMF JSON structure
 */
interface EMFLog {
  _aws: {
    Timestamp: number;
    CloudWatchMetrics: Array<{
      Namespace: string;
      Dimensions: Array<Array<string>>;
      Metrics: Array<{
        Name: string;
        Unit: MetricUnit;
      }>;
    }>;
  };
  [key: string]: any;
}

/**
 * CloudWatch implementation of MetricsService
 */
export class CloudWatchMetricsService implements MetricsService {
  private namespace: string;
  private defaultDimensions: Record<string, string>;
  private sessionId?: string;
  private userProperties: Record<string, any> = {};
  private context: Record<string, string> = {};

  /**
   * @param baseNamespace - Base CloudWatch namespace (default: 'nueink')
   * @param customDimensions - Additional default dimensions
   */
  constructor(
    baseNamespace: string = 'nueink',
    customDimensions: Record<string, string> = {}
  ) {
    const environment = this.detectEnvironment();

    // Separate namespaces per environment for clean separation
    this.namespace = `${baseNamespace}-${environment}`;

    // Static dimensions (never change for this instance)
    this.defaultDimensions = {
      Platform: STANDARD_DIMENSIONS.PLATFORM.LAMBDA,
      Environment: environment,
      ...customDimensions
    };
  }

  /**
   * Auto-detect environment from Amplify env vars
   */
  private detectEnvironment(): Environment {
    // Amplify sandbox
    if (
      process.env.AWS_BRANCH === 'sandbox' ||
      process.env.AMPLIFY_ENVIRONMENT === 'sandbox'
    ) {
      return STANDARD_DIMENSIONS.ENVIRONMENT.DEV;
    }

    // Staging branch (if configured)
    if (process.env.AWS_BRANCH === 'staging') {
      return STANDARD_DIMENSIONS.ENVIRONMENT.STAGING;
    }

    // Production (main/master branch)
    if (
      process.env.AWS_BRANCH === 'main' ||
      process.env.AWS_BRANCH === 'master' ||
      process.env.AMPLIFY_ENVIRONMENT === 'production'
    ) {
      return STANDARD_DIMENSIONS.ENVIRONMENT.PROD;
    }

    // Default to dev for safety (don't pollute prod metrics)
    return STANDARD_DIMENSIONS.ENVIRONMENT.DEV;
  }

  /**
   * Set session ID for current session
   */
  public setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  /**
   * Set user properties for segmentation
   */
  public setUserProperties(properties: UserProperties): void {
    this.userProperties = properties;
  }

  /**
   * Set context for current screen/feature
   */
  public setContext(context: MetricContext): void {
    this.context = {
      ...(context.screen && { Screen: context.screen }),
      ...(context.feature && { Feature: context.feature }),
      ...(context.flow && { Flow: context.flow }),
    };
  }

  /**
   * Record a metric with type-safe dimensions
   */
  public record<K extends MetricKey>(
    metricKey: K,
    value: number,
    dimensions: MetricDimensionsObject<K>,
    metadata?: Record<string, any>
  ): void {
    const definition = METRIC_DEFINITIONS[metricKey];

    // Validate dimensions (optional runtime check)
    const providedDims = Object.keys(dimensions);
    const requiredDims = definition.dimensions as readonly string[];
    const missing = requiredDims.filter(d => !providedDims.includes(d));
    if (missing.length > 0) {
      console.warn(
        `[CloudWatchMetricsService] Missing dimensions for ${metricKey}: ${missing.join(', ')}`
      );
    }

    // Merge all dimensions
    const allDimensions = {
      ...this.defaultDimensions,  // Platform, Environment (static)
      ...(this.sessionId && { SessionId: this.sessionId }),  // Session tracking
      ...this.context,  // Screen, Feature, Flow
      ...dimensions,  // Metric-specific
    };

    // Merge all metadata
    const allMetadata = {
      ...this.userProperties,  // User segmentation
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    // Publish EMF log
    this.publishMetric(
      { [definition.metricName]: value },
      allDimensions,
      definition.unit,
      allMetadata
    );
  }

  /**
   * Record multiple metrics in a batch
   */
  public recordBatch(
    metrics: Array<{
      key: MetricKey;
      value: number;
      dimensions: Record<string, string>;
      metadata?: Record<string, any>;
    }>
  ): void {
    for (const metric of metrics) {
      this.record(
        metric.key,
        metric.value,
        metric.dimensions as any,
        metric.metadata
      );
    }
  }

  /**
   * Start tracking an operation
   */
  public startOperation(
    operation: string,
    dimensions: Record<string, string>
  ): Operation {
    return new CloudWatchOperation(this, operation, dimensions);
  }

  /**
   * Publish EMF-formatted metric to CloudWatch
   */
  private publishMetric(
    metrics: { [key: string]: number },
    dimensions: Record<string, string>,
    unit: MetricUnit,
    metadata: Record<string, any> = {}
  ): void {
    const emfLog = this.buildEMFLog(metrics, dimensions, unit, metadata);
    console.log(JSON.stringify(emfLog));
  }

  /**
   * Build EMF-compliant JSON log
   */
  private buildEMFLog(
    metrics: { [key: string]: number },
    dimensions: Record<string, string>,
    unit: MetricUnit,
    metadata: Record<string, any>
  ): EMFLog {
    const dimensionKeys = Object.keys(dimensions);
    const metricEntries = Object.entries(metrics).map(([name, _value]) => ({
      Name: name,
      Unit: unit,
    }));

    return {
      _aws: {
        Timestamp: Date.now(),
        CloudWatchMetrics: [
          {
            Namespace: this.namespace,
            Dimensions: [dimensionKeys],
            Metrics: metricEntries,
          },
        ],
      },
      ...dimensions,
      ...metrics,
      ...metadata,
    };
  }

  /**
   * Categorize error into standard error types
   */
  public static categorizeError(error: string | Error): string {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorLower = errorMessage.toLowerCase();

    if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
      return 'Timeout';
    }
    if (errorLower.includes('unauthorized') || errorLower.includes('401')) {
      return 'Unauthorized';
    }
    if (errorLower.includes('forbidden') || errorLower.includes('403')) {
      return 'Forbidden';
    }
    if (errorLower.includes('not found') || errorLower.includes('404')) {
      return 'NotFound';
    }
    if (errorLower.includes('rate limit') || errorLower.includes('429')) {
      return 'RateLimit';
    }
    if (errorLower.includes('network') || errorLower.includes('connection')) {
      return 'Network';
    }
    if (errorLower.includes('validation')) {
      return 'Validation';
    }

    return 'Unknown';
  }
}

/**
 * Operation helper for tracking start/end/duration
 */
class CloudWatchOperation implements Operation {
  private startTime: number;
  private completed: boolean = false;

  constructor(
    private metrics: CloudWatchMetricsService,
    private operation: string,
    private dimensions: Record<string, string>
  ) {
    this.startTime = Date.now();
  }

  /**
   * Mark operation as successful
   */
  public succeed(metadata?: Record<string, any>): void {
    if (this.completed) {
      console.warn(`[CloudWatchOperation] Operation ${this.operation} already completed`);
      return;
    }

    const duration = Date.now() - this.startTime;
    this.completed = true;

    // Record API_LATENCY metric (generic operation tracking)
    this.metrics.record(
      'API_LATENCY',
      duration,
      {
        Operation: this.operation,
        Status: STANDARD_DIMENSIONS.STATUS.SUCCESS,
      },
      {
        ...this.dimensions,
        ...metadata,
      }
    );
  }

  /**
   * Mark operation as failed
   */
  public fail(error: Error | string): void {
    if (this.completed) {
      console.warn(`[CloudWatchOperation] Operation ${this.operation} already completed`);
      return;
    }

    const duration = Date.now() - this.startTime;
    const errorType = CloudWatchMetricsService.categorizeError(error);
    const errorMessage = error instanceof Error ? error.message : error;
    this.completed = true;

    // Record ERROR_OCCURRED metric
    this.metrics.record(
      'ERROR_OCCURRED',
      1,
      {
        ErrorType: errorType,
        Feature: this.operation,
        Severity: STANDARD_DIMENSIONS.SEVERITY.MEDIUM,
      },
      {
        ...this.dimensions,
        error: errorMessage,
        duration,
      }
    );
  }
}
