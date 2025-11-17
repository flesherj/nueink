/**
 * Type-safe metric definitions for CloudWatch and analytics platforms
 *
 * Architecture:
 * - Definitions in @nueink/core (platform-agnostic)
 * - MetricsService interface in @nueink/core
 * - CloudWatchMetricsService in @nueink/aws (Lambda implementation)
 * - Future: AmplitudeMetricsService for mobile, WebMetricsService for web
 *
 * Benefits:
 * - Full TypeScript type safety for dimensions
 * - Autocomplete in IDE for required dimensions
 * - Self-documenting with inline descriptions
 * - Easy to extend (just add new definitions)
 * - Can generate dashboards from definitions
 *
 * Usage:
 * ```typescript
 * metrics.record('USER_SIGNUP', 1, {
 *   Provider: 'Google',
 *   EmailDomain: 'gmail.com',
 *   Status: 'success'
 * });
 * ```
 */

/**
 * Environment type (applies to all platforms)
 */
export type Environment = 'dev' | 'staging' | 'prod';

/**
 * Platform type (where code is running)
 */
export type Platform = 'lambda' | 'ios' | 'android' | 'web';

/**
 * Supported metric units
 */
export type MetricUnit = 'Count' | 'Milliseconds' | 'Percent' | 'Bytes';

/**
 * Type-safe metric definition
 */
export interface MetricDefinition<
  TName extends string,
  TDimensions extends readonly string[],
  TUnit extends MetricUnit
> {
  readonly metricName: TName;
  readonly dimensions: TDimensions;
  readonly unit: TUnit;
  readonly description?: string;
}

/**
 * Helper to create metric definitions with full type inference
 */
const defineMetric = <
  TName extends string,
  TDimensions extends readonly string[],
  TUnit extends MetricUnit
>(
  definition: MetricDefinition<TName, TDimensions, TUnit>
) => definition;

/**
 * All metric definitions
 */
export const METRIC_DEFINITIONS = {
  // ============================================
  // Authentication Metrics
  // ============================================

  USER_SIGNUP: defineMetric({
    metricName: 'UserSignup',
    dimensions: ['Provider', 'EmailDomain', 'Status'] as const,
    unit: 'Count',
    description: 'User completed signup flow (account + org + membership created)'
  }),

  SIGNUP_DURATION: defineMetric({
    metricName: 'SignupDuration',
    dimensions: ['Provider'] as const,
    unit: 'Milliseconds',
    description: 'Time to complete signup process'
  }),

  SIGNUP_FAILURE: defineMetric({
    metricName: 'SignupFailure',
    dimensions: ['Provider', 'ErrorType'] as const,
    unit: 'Count',
    description: 'User signup failed with error'
  }),

  USER_LOGIN: defineMetric({
    metricName: 'UserLogin',
    dimensions: ['Provider', 'LoginType'] as const,
    unit: 'Count',
    description: 'User logged in (LoginType: new or refresh)'
  }),

  // ============================================
  // Financial Sync Metrics
  // ============================================

  SYNC_SUCCESS: defineMetric({
    metricName: 'SyncSuccess',
    dimensions: ['UserId', 'Provider', 'Status'] as const,
    unit: 'Count',
    description: 'Financial data sync completed successfully'
  }),

  SYNC_FAILURE: defineMetric({
    metricName: 'SyncFailure',
    dimensions: ['UserId', 'Provider', 'Status', 'ErrorType'] as const,
    unit: 'Count',
    description: 'Financial data sync failed'
  }),

  SYNC_DURATION: defineMetric({
    metricName: 'SyncDuration',
    dimensions: ['UserId', 'Provider'] as const,
    unit: 'Milliseconds',
    description: 'Time to complete financial sync'
  }),

  ACCOUNTS_SYNCED: defineMetric({
    metricName: 'AccountsSynced',
    dimensions: ['UserId', 'Provider'] as const,
    unit: 'Count',
    description: 'Number of financial accounts synced'
  }),

  TRANSACTIONS_SYNCED: defineMetric({
    metricName: 'TransactionsSynced',
    dimensions: ['UserId', 'Provider'] as const,
    unit: 'Count',
    description: 'Number of transactions synced'
  }),

  BALANCE_REFRESH_SUCCESS: defineMetric({
    metricName: 'BalanceRefreshSuccess',
    dimensions: ['UserId', 'Provider', 'Status'] as const,
    unit: 'Count',
    description: 'Account balances refreshed successfully'
  }),

  BALANCE_REFRESH_FAILURE: defineMetric({
    metricName: 'BalanceRefreshFailure',
    dimensions: ['UserId', 'Provider', 'Status', 'ErrorType'] as const,
    unit: 'Count',
    description: 'Account balance refresh failed'
  }),

  BALANCE_REFRESH_DURATION: defineMetric({
    metricName: 'BalanceRefreshDuration',
    dimensions: ['UserId', 'Provider'] as const,
    unit: 'Milliseconds',
    description: 'Time to refresh account balances'
  }),

  ACCOUNTS_REFRESHED: defineMetric({
    metricName: 'AccountsRefreshed',
    dimensions: ['UserId', 'Provider'] as const,
    unit: 'Count',
    description: 'Number of accounts with updated balances'
  }),

  // ============================================
  // OAuth Integration Metrics
  // ============================================

  OAUTH_CALLBACK_SUCCESS: defineMetric({
    metricName: 'OAuthCallbackSuccess',
    dimensions: ['UserId', 'Provider', 'Status'] as const,
    unit: 'Count',
    description: 'OAuth callback completed successfully'
  }),

  OAUTH_CALLBACK_FAILURE: defineMetric({
    metricName: 'OAuthCallbackFailure',
    dimensions: ['ErrorType', 'Status'] as const,
    unit: 'Count',
    description: 'OAuth callback failed'
  }),

  OAUTH_CALLBACK_DURATION: defineMetric({
    metricName: 'OAuthCallbackDuration',
    dimensions: ['UserId', 'Provider'] as const,
    unit: 'Milliseconds',
    description: 'Time to process OAuth callback'
  }),

  INTEGRATION_SYNC_TRIGGER_FAILURE: defineMetric({
    metricName: 'IntegrationSyncTriggerFailure',
    dimensions: ['UserId', 'Provider', 'Status'] as const,
    unit: 'Count',
    description: 'Failed to trigger immediate sync after integration connection'
  }),

  // ============================================
  // Engagement Metrics
  // ============================================

  SCREEN_VIEWED: defineMetric({
    metricName: 'ScreenViewed',
    dimensions: ['UserId', 'Screen'] as const,
    unit: 'Count',
    description: 'User viewed a screen'
  }),

  SESSION_DURATION: defineMetric({
    metricName: 'SessionDuration',
    dimensions: ['UserId'] as const,
    unit: 'Milliseconds',
    description: 'Total session duration from open to close'
  }),

  FEATURE_USED: defineMetric({
    metricName: 'FeatureUsed',
    dimensions: ['UserId', 'Feature'] as const,
    unit: 'Count',
    description: 'User interacted with a feature'
  }),

  DAILY_ACTIVE_USER: defineMetric({
    metricName: 'DailyActiveUser',
    dimensions: ['UserId'] as const,
    unit: 'Count',
    description: 'Deduplicated daily active user (emit once per day per user)'
  }),

  // ============================================
  // Funnel/Conversion Metrics
  // ============================================

  ONBOARDING_STEP_COMPLETED: defineMetric({
    metricName: 'OnboardingStepCompleted',
    dimensions: ['UserId', 'Step'] as const,
    unit: 'Count',
    description: 'User completed onboarding step (signup, connect_account, first_sync, view_feed)'
  }),

  TIME_TO_FIRST_VALUE: defineMetric({
    metricName: 'TimeToFirstValue',
    dimensions: ['UserId', 'Provider'] as const,
    unit: 'Milliseconds',
    description: 'Time from signup to first transaction visible'
  }),

  INTEGRATION_CONNECTED: defineMetric({
    metricName: 'IntegrationConnected',
    dimensions: ['UserId', 'Provider'] as const,
    unit: 'Count',
    description: 'User successfully connected financial integration'
  }),

  INTEGRATION_DISCONNECTED: defineMetric({
    metricName: 'IntegrationDisconnected',
    dimensions: ['UserId', 'Provider', 'Reason'] as const,
    unit: 'Count',
    description: 'User disconnected financial integration (churn indicator)'
  }),

  // ============================================
  // Social Features (Unique Value Prop)
  // ============================================

  COMMENT_POSTED: defineMetric({
    metricName: 'CommentPosted',
    dimensions: ['UserId', 'FeedItemType'] as const,
    unit: 'Count',
    description: 'User posted comment on feed item'
  }),

  TRANSACTION_DISCUSSED: defineMetric({
    metricName: 'TransactionDiscussed',
    dimensions: ['UserId', 'CommentCount'] as const,
    unit: 'Count',
    description: 'Transaction received comments (CommentCount: 1, 2-5, 6+)'
  }),

  MENTION_USED: defineMetric({
    metricName: 'MentionUsed',
    dimensions: ['UserId'] as const,
    unit: 'Count',
    description: 'User @mentioned family member in comment'
  }),

  FAMILY_MEMBER_INVITED: defineMetric({
    metricName: 'FamilyMemberInvited',
    dimensions: ['UserId'] as const,
    unit: 'Count',
    description: 'User invited family member to organization'
  }),

  // ============================================
  // Operational Metrics
  // ============================================

  API_LATENCY: defineMetric({
    metricName: 'APILatency',
    dimensions: ['Operation', 'Status'] as const,
    unit: 'Milliseconds',
    description: 'API operation latency'
  }),

  ERROR_OCCURRED: defineMetric({
    metricName: 'ErrorOccurred',
    dimensions: ['ErrorType', 'Feature', 'Severity'] as const,
    unit: 'Count',
    description: 'Application error occurred'
  }),

  LAMBDA_COLD_START: defineMetric({
    metricName: 'LambdaColdStart',
    dimensions: ['FunctionName'] as const,
    unit: 'Milliseconds',
    description: 'Lambda cold start duration'
  }),

  // ============================================
  // Future Metrics (Placeholders)
  // ============================================

  BUDGET_CREATED: defineMetric({
    metricName: 'BudgetCreated',
    dimensions: ['UserId', 'BudgetType'] as const,
    unit: 'Count',
    description: 'User created budget'
  }),

  RECEIPT_UPLOADED: defineMetric({
    metricName: 'ReceiptUploaded',
    dimensions: ['UserId'] as const,
    unit: 'Count',
    description: 'User uploaded receipt photo'
  }),

  BILL_SCANNED: defineMetric({
    metricName: 'BillScanned',
    dimensions: ['UserId'] as const,
    unit: 'Count',
    description: 'User scanned bill'
  }),

  // ============================================
  // AI Categorization Metrics
  // ============================================

  TRANSACTIONS_CATEGORIZED: defineMetric({
    metricName: 'TransactionsCategorized',
    dimensions: ['OrganizationId', 'Provider'] as const,
    unit: 'Count',
    description: 'Number of transactions categorized by AI'
  }),

  CATEGORIZATION_FAILURE: defineMetric({
    metricName: 'CategorizationFailure',
    dimensions: ['OrganizationId', 'ErrorType'] as const,
    unit: 'Count',
    description: 'AI categorization failed with error'
  }),

  CATEGORIZATION_DURATION: defineMetric({
    metricName: 'CategorizationDuration',
    dimensions: ['OrganizationId'] as const,
    unit: 'Milliseconds',
    description: 'Time to complete AI categorization for batch'
  }),

  SPLITS_CREATED: defineMetric({
    metricName: 'SplitsCreated',
    dimensions: ['OrganizationId', 'SplitType'] as const,
    unit: 'Count',
    description: 'Number of transaction splits created (SplitType: single or multi)'
  }),

  AI_CONFIDENCE: defineMetric({
    metricName: 'AIConfidence',
    dimensions: ['OrganizationId', 'Category'] as const,
    unit: 'Percent',
    description: 'Average AI confidence score for categorizations'
  }),

} as const;

/**
 * Type helpers for type-safe metric recording
 */
export type MetricKey = keyof typeof METRIC_DEFINITIONS;
export type MetricDimensions<K extends MetricKey> = typeof METRIC_DEFINITIONS[K]['dimensions'][number];
export type MetricName = typeof METRIC_DEFINITIONS[MetricKey]['metricName'];
export type MetricDimensionsObject<K extends MetricKey> = Record<MetricDimensions<K>, string>;

/**
 * Standard dimension values (for consistency)
 */
export const STANDARD_DIMENSIONS = {
  // Platforms (auto-detected in constructor)
  PLATFORM: {
    LAMBDA: 'lambda',
    IOS: 'ios',
    ANDROID: 'android',
    WEB: 'web',
  },

  // Environments (auto-detected from Amplify)
  ENVIRONMENT: {
    DEV: 'dev',      // Sandbox, local testing
    STAGING: 'staging', // Pre-production
    PROD: 'prod',    // Production
  },

  // Auth providers
  PROVIDER: {
    GOOGLE: 'Google',
    APPLE: 'Apple',
    FACEBOOK: 'Facebook',
    AMAZON: 'Amazon',
    NUEINK: 'NueInk', // Email/password
  },

  // Financial providers
  FINANCIAL_PROVIDER: {
    YNAB: 'ynab',
    PLAID: 'plaid',
    MANUAL: 'manual',
  },

  // Statuses
  STATUS: {
    SUCCESS: 'success',
    FAILURE: 'failure',
  },

  // Login types
  LOGIN_TYPE: {
    NEW: 'new',
    REFRESH: 'refresh',
  },

  // Onboarding steps
  ONBOARDING_STEP: {
    SIGNUP: 'signup',
    CONNECT_ACCOUNT: 'connect_account',
    FIRST_SYNC: 'first_sync',
    VIEW_FEED: 'view_feed',
  },

  // Feed item types
  FEED_ITEM_TYPE: {
    TRANSACTION: 'transaction',
    BUDGET_ALERT: 'budget_alert',
    ACCOUNT_UPDATE: 'account_update',
    MILESTONE: 'milestone',
  },

  // Comment counts (bucketed)
  COMMENT_COUNT: {
    ONE: '1',
    TWO_TO_FIVE: '2-5',
    SIX_PLUS: '6+',
  },

  // Error severity
  SEVERITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
  },

} as const;
