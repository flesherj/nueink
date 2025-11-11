/**
 * MetricsService for CloudWatch Embedded Metric Format (EMF)
 *
 * Publishes metrics to CloudWatch via structured JSON logs.
 * EMF is FREE - metrics are extracted from logs automatically by CloudWatch.
 *
 * Cost: ~$0.50/GB of logs vs $0.01 per PutMetricData API call
 *
 * Usage:
 * ```typescript
 * const metrics = new MetricsService('nueink', 'sync');
 * metrics.recordSyncSuccess('user-123', 'ynab', 150); // 150ms duration
 * metrics.recordSyncFailure('user-456', 'plaid', 'Connection timeout');
 * ```
 */

export interface MetricDimensions {
  [key: string]: string;
}

export interface MetricMetadata {
  [key: string]: string | number | boolean;
}

/**
 * CloudWatch EMF JSON structure
 * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format_Specification.html
 */
interface EMFLog {
  _aws: {
    Timestamp: number;
    CloudWatchMetrics: Array<{
      Namespace: string;
      Dimensions: Array<Array<string>>;
      Metrics: Array<{
        Name: string;
        Unit?: string;
      }>;
    }>;
  };
  [key: string]: any;
}

export class MetricsService {
  private namespace: string;
  private defaultDimensions: MetricDimensions;

  /**
   * @param namespace CloudWatch namespace (e.g., "nueink", "nueink/sync")
   * @param defaultDimensions Default dimensions applied to all metrics
   */
  constructor(namespace: string, defaultDimensions: MetricDimensions = {}) {
    this.namespace = namespace;
    this.defaultDimensions = defaultDimensions;
  }

  /**
   * Record a successful sync operation
   *
   * Publishes metrics:
   * - SyncSuccess: 1 (count)
   * - SyncDuration: duration in milliseconds
   *
   * Dimensions:
   * - UserId
   * - Provider
   * - Environment (from defaultDimensions)
   */
  public recordSyncSuccess = (
    userId: string,
    provider: string,
    durationMs: number
  ): void => {
    this.publishMetric(
      {
        SyncSuccess: 1,
        SyncDuration: durationMs,
      },
      {
        ...this.defaultDimensions,
        UserId: userId,
        Provider: provider,
        Status: 'success',
      },
      {
        durationMs,
        timestamp: new Date().toISOString(),
      }
    );
  };

  /**
   * Record a failed sync operation
   *
   * Publishes metrics:
   * - SyncFailure: 1 (count)
   *
   * Dimensions:
   * - UserId
   * - Provider
   * - ErrorType (derived from error message)
   * - Environment (from defaultDimensions)
   */
  public recordSyncFailure = (
    userId: string,
    provider: string,
    error: string
  ): void => {
    const errorType = this.categorizeError(error);

    this.publishMetric(
      {
        SyncFailure: 1,
      },
      {
        ...this.defaultDimensions,
        UserId: userId,
        Provider: provider,
        Status: 'failure',
        ErrorType: errorType,
      },
      {
        error,
        timestamp: new Date().toISOString(),
      }
    );
  };

  /**
   * Record account sync metrics
   *
   * Publishes metrics:
   * - AccountsSynced: count of accounts synced
   *
   * Dimensions:
   * - UserId
   * - Provider
   */
  public recordAccountsSync = (
    userId: string,
    provider: string,
    accountCount: number
  ): void => {
    this.publishMetric(
      {
        AccountsSynced: accountCount,
      },
      {
        ...this.defaultDimensions,
        UserId: userId,
        Provider: provider,
      },
      {
        accountCount,
        timestamp: new Date().toISOString(),
      }
    );
  };

  /**
   * Record transaction sync metrics
   *
   * Publishes metrics:
   * - TransactionsSynced: count of transactions synced
   *
   * Dimensions:
   * - UserId
   * - Provider
   */
  public recordTransactionsSync = (
    userId: string,
    provider: string,
    transactionCount: number
  ): void => {
    this.publishMetric(
      {
        TransactionsSynced: transactionCount,
      },
      {
        ...this.defaultDimensions,
        UserId: userId,
        Provider: provider,
      },
      {
        transactionCount,
        timestamp: new Date().toISOString(),
      }
    );
  };

  /**
   * Publish a custom metric
   *
   * @param metrics Key-value pairs of metric names and values
   * @param dimensions Metric dimensions for filtering/grouping
   * @param metadata Additional context (not indexed, for debugging)
   */
  public publishMetric = (
    metrics: { [key: string]: number },
    dimensions: MetricDimensions,
    metadata: MetricMetadata = {}
  ): void => {
    const emfLog = this.buildEMFLog(metrics, dimensions, metadata);
    console.log(JSON.stringify(emfLog));
  };

  /**
   * Build EMF-compliant JSON log
   */
  private buildEMFLog = (
    metrics: { [key: string]: number },
    dimensions: MetricDimensions,
    metadata: MetricMetadata
  ): EMFLog => {
    const dimensionKeys = Object.keys(dimensions);
    const metricEntries = Object.entries(metrics).map(([name, _value]) => ({
      Name: name,
      Unit: name.includes('Duration') ? 'Milliseconds' : 'Count',
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
  };

  /**
   * Categorize error into standard error types for dimension filtering
   */
  private categorizeError = (error: string): string => {
    const errorLower = error.toLowerCase();

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
  };
}
