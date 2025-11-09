/**
 * NueInk Event Types
 *
 * Event-driven architecture for financial data processing
 * All events follow the pattern: domain.entity.action
 */

export enum NueInkEventType {
  // Institution Events
  INSTITUTION_CONNECTED = 'nueink.institution.connected',
  INSTITUTION_DISCONNECTED = 'nueink.institution.disconnected',
  INSTITUTION_SYNC_STARTED = 'nueink.institution.sync.started',
  INSTITUTION_SYNC_COMPLETED = 'nueink.institution.sync.completed',
  INSTITUTION_SYNC_FAILED = 'nueink.institution.sync.failed',

  // Transaction Events
  TRANSACTIONS_SYNCED = 'nueink.transactions.synced',
  TRANSACTION_CREATED = 'nueink.transaction.created',
  TRANSACTION_UPDATED = 'nueink.transaction.updated',
  TRANSACTION_CATEGORIZED = 'nueink.transaction.categorized',

  // Comment Events
  COMMENT_CREATED = 'nueink.comment.created',
  COMMENT_UPDATED = 'nueink.comment.updated',
  COMMENT_DELETED = 'nueink.comment.deleted',

  // Person Assignment Events
  PERSON_ASSIGNED = 'nueink.person.assigned',
  PERSON_CREATED = 'nueink.person.created',
  PERSON_UPDATED = 'nueink.person.updated',

  // Budget Events
  BUDGET_THRESHOLD_REACHED = 'nueink.budget.threshold.reached',
  BUDGET_EXCEEDED = 'nueink.budget.exceeded',
  BUDGET_UPDATED = 'nueink.budget.updated',

  // Debt Events
  DEBT_PAYMENT_DETECTED = 'nueink.debt.payment.detected',
  DEBT_PAID_OFF = 'nueink.debt.paid_off',
  DEBT_UPDATED = 'nueink.debt.updated',

  // Account Events
  ACCOUNT_CREATED = 'nueink.account.created',
  ORGANIZATION_CREATED = 'nueink.organization.created',
}

/**
 * Base event interface - all events extend this
 */
export interface NueInkEvent<T = any> {
  eventId: string;                 // Unique ID for this event
  eventType: NueInkEventType;      // What happened
  source: string;                  // Where it came from (lambda name, api, etc.)
  correlationId: string;           // Business transaction ID
  timestamp: string;               // When it happened (ISO 8601)
  organizationId: string;          // Who owns this data
  accountId?: string;              // Who triggered it (optional)
  data: T;                         // Event-specific payload
  metadata?: Record<string, any>; // Optional extra context for future extensibility
}

/**
 * Event payload types
 */

export interface InstitutionConnectedEvent {
  institutionId: string;
  provider: string;
  externalId?: string;
  externalItemId?: string;
  name: string;
}

export interface InstitutionSyncCompletedEvent {
  institutionId: string;
  transactionsCount: number;
  accountsCount: number;
  syncDurationMs: number;
}

export interface InstitutionSyncFailedEvent {
  institutionId: string;
  error: string;
  errorCode?: string;
}

export interface TransactionsSyncedEvent {
  institutionId: string;
  financialAccountId: string;
  transactionIds: string[];
  count: number;
}

export interface TransactionCreatedEvent {
  transactionId: string;
  financialAccountId: string;
  amount: number;
  merchantName?: string;
  date: string;
  pending: boolean;
}

export interface TransactionCategorizedEvent {
  transactionId: string;
  category: string[];
  primaryCategory: string;
}

export interface CommentCreatedEvent {
  commentId: string;
  transactionId: string;
  accountId: string;
  text: string;
}

export interface PersonAssignedEvent {
  personId: string;
  entityType: 'transaction' | 'financial_account';
  entityId: string;
}

export interface PersonCreatedEvent {
  personId: string;
  name: string;
  color?: string;
}

export interface BudgetThresholdReachedEvent {
  budgetId: string;
  category: string;
  amount: number;
  spent: number;
  threshold: number; // e.g., 0.8 for 80%
}

export interface BudgetExceededEvent {
  budgetId: string;
  category: string;
  amount: number;
  spent: number;
  overage: number;
}

export interface DebtPaymentDetectedEvent {
  debtId: string;
  transactionId: string;
  paymentAmount: number;
  newBalance: number;
}

export interface DebtPaidOffEvent {
  debtId: string;
  name: string;
  originalBalance: number;
  totalPaid: number;
  paidOffDate: string;
}

export interface AccountCreatedEvent {
  accountId: string;
  email: string;
  username: string;
  provider: string;
}

export interface OrganizationCreatedEvent {
  orgId: string;
  name: string;
  type: string;
  createdByAccountId: string;
}
