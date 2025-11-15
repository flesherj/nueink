# NueInk - Architecture & Technical Decisions

**Last Updated:** November 14, 2025

This document captures key architectural decisions, patterns, and deferred technical features.

---

## Key Architectural Decisions

### Clean Architecture (November 11, 2025)

**Package Separation:**
- `@nueink/core` = React Native safe (domain models, services, repository interfaces)
- `@nueink/aws` = Lambda only (infrastructure, repository implementations, EventBridge)
- `@nueink/sdk` = Client REST API access (uses Amplify API with Cognito auth)
- Repository interfaces use generics (no AWS dependencies)
- Services return domain models, not entities
- Converters bridge domain ↔ entities (can import from aws)

**Benefits:**
- React Native can safely import `@nueink/core`
- Lambdas use both `@nueink/core` and `@nueink/aws`
- Clear separation of platform-agnostic vs AWS-specific code
- Enables future platform support (web, desktop)

### Financial Sync Architecture (November 11-14, 2025)

**Event-Driven Sync:**
- EventBridge scheduler for periodic sync (every 4 hours)
- EventBridge rules for event-driven sync (IntegrationConnected, ManualSyncTriggered)
- Explicit `ruleName` properties to avoid CDK 64-character limit
- Event bus name passed via environment variable (CDK auto-generates unique names)

**Data Storage:**
- Direct to Transaction/FinancialAccount tables (no cache layers)
- AWSJSON scalar type for rawData fields (preserves complete provider responses)
- Converters use JSON.stringify/parse for proper type handling
- Cache tables added later if read performance becomes issue

**Metrics & Monitoring:**
- CloudWatch EMF (not PutMetricData) for free metrics
- Structured JSON logs with embedded metrics
- No dedicated monitoring infrastructure yet

**Error Handling:**
- No DLQ - next scheduled sync handles failures
- Idempotent writes (upsert by externalAccountId / externalTransactionId)
- Graceful degradation (partial sync success logged)

### Social Feed Architecture (November 11, 2025)

**Feed Generation:**
- Dedicated FeedItem table (not client-side aggregation)
- DynamoDB Streams → Feed Generation Lambda → FeedItem records
- Single AppSync subscription per client (FeedItem.onCreate/onUpdate)
- Server-side aggregation and feed generation
- Feed-specific metadata (isRead, reactions, commentCount)

**Benefits:**
- Consistent feed across all clients
- Performance (pre-aggregated, no complex joins)
- Real-time updates via AppSync subscriptions

### Real-Time Communication Strategy

**Current (MVP):**
- AppSync built-in subscriptions for feed updates
- REST API polling for sync status (simple, works for testing)

**Phase 2 (Post-MVP):**
- Add AWS IoT Core for in-app real-time updates
- Add SNS Mobile Push for background notifications
- Cost: ~$1.50/month per 1K users (vs $30/month with AppSync subscriptions)

**Why Not CQRS/Materialized Views:**
- ❌ Doubles storage costs (domain + view tables)
- ❌ Consistency complexity (DynamoDB Streams or EventBridge projectors)
- ❌ Premature optimization - no evidence of need yet
- ❌ Adds cognitive load during MVP development
- ✅ Reconsider when: Read/write ratio > 10:1, complex aggregations needed, performance issues

**See:** CURRENT.md "Future: Real-Time Communication Architecture (Deferred)" for full analysis

### Secret Management Pattern

**Core package** defines business logic and interfaces:
- `SecretManager` interface - Platform-agnostic secret storage contract
- Domain services (e.g., `IntegrationConfigService`) handle:
  - Secret naming conventions
  - Data structure and serialization
  - Business validation
  - Calling SecretManager for storage

**AWS package** provides infrastructure implementations:
- `SecretsManagerService` - Generic AWS Secrets Manager implementation
- NO business logic - just storage operations (store/get/update/delete)
- Reusable for any secret type (tokens, API keys, webhooks, etc.)

**Example:**
```typescript
// Core: IntegrationConfigService handles integration-specific logic
const integrationService = new IntegrationConfigService(repository, secretManager);
await integrationService.storeTokens('account-123', 'ynab', {
  accessToken: '...',
  refreshToken: '...',
  expiresAt: new Date()
});

// AWS: SecretsManagerService is generic infrastructure
const secretManager = new SecretsManagerService();
await secretManager.storeSecret('my-secret-name', { key: 'value' });
```

### REST API vs Direct AppSync Access

**Decision (November 14, 2025):** Clients use REST API, not direct AppSync

**Architecture:**
- API Gateway REST API with Cognito IAM authorization
- Express Lambda with router/controller pattern
- Uses NueInkServiceFactory (same as financial Lambdas)
- Clients use `@nueink/sdk` package for type-safe API access

**Why REST API:**
- ✅ Separates client concerns from backend data layer
- ✅ Enables business logic enforcement before data access
- ✅ Provides single API surface for future web/desktop clients
- ✅ Allows rate limiting and caching at API Gateway level
- ✅ Uses Cognito IAM auth (no API keys to manage)
- ✅ EventBridge integration for manual sync triggers

**AppSync Still Used For:**
- Lambda → DynamoDB writes (publicApiKey auth mode)
- Future: Real-time subscriptions for feed updates

### Authorization Model

**Owner-Based Access:**
- All protected models use `profileOwner` field (Cognito user ID)
- Client queries automatically filtered by profileOwner
- Prevents cross-user data leakage

**Dual Authorization:**
- `allow.ownerDefinedIn('profileOwner')` - User access
- `allow.publicApiKey()` - Lambda write access

**Why Both:**
- Lambdas write data on behalf of users (sync, feed generation)
- Users read/write their own data directly
- API key mode is default for server-side operations

### Factory Pattern

**Repository Factory:**
- `NueInkRepositoryFactory` creates all repositories
- Singleton pattern (getInstance)
- Accepts Amplify client with configurable auth mode
- Used by both Lambdas and client apps

**Service Factory:**
- `NueInkServiceFactory` creates all services
- Takes repository factory as dependency
- Ensures consistent service instantiation
- Used everywhere: Lambdas, client apps, tests

**Example:**
```typescript
// Lambda context
const client = generateClient<Schema>({ authMode: 'iam' });
const repositoryFactory = NueInkRepositoryFactory.getInstance(client);
const serviceFactory = NueInkServiceFactory.getInstance(repositoryFactory);
const accountService = serviceFactory.account();

// Client context (React Native)
const client = generateClient<Schema>({ authMode: 'userPool' });
const repositoryFactory = NueInkRepositoryFactory.getInstance(client);
const serviceFactory = NueInkServiceFactory.getInstance(repositoryFactory);
const accountService = serviceFactory.account();
```

---

## Deferred Features & Technical Debt

### AWS IoT Core for Real-Time Updates

**Status:** Documented, not implemented
**When:** Phase 2 (Post-MVP)
**Why Deferred:** REST polling works for MVP, IoT Core adds infrastructure complexity
**Cost Benefit:** ~20x cheaper than AppSync subscriptions at scale

**See:** docs/CURRENT.md - "Future: Real-Time Communication Architecture"

### CQRS / Materialized Views

**Status:** Evaluated, decided against for now
**When:** Only if read/write ratio > 10:1 and performance issues arise
**Why Deferred:** Premature optimization, doubles storage costs, adds complexity

### Widget Infrastructure

**Status:** Designed, implementation in Phase 1.9
**Technical Notes:**
- App Groups for iOS shared data
- Shared Preferences for Android
- JSON-based snapshot storage
- Widget limitations: No biometric prompts (platform restriction)

**See:** Planned in original TASKS.md Phase 1.9 section

### Explicit Account Selection

**Status:** Designed (Option B architecture), deferred to Phase 2+
**When:** After basic UI displays synced data
**Why Deferred:** Clean migration path exists, requires frontend picker UI (significant work)

**Migration Plan:**
- Add `selectedAccountIds` to IntegrationConfig
- Backfill existing integrations (all current accounts = selected)
- YNAB: Detect new accounts, notify user
- Plaid: Requires Update Mode re-link

**See:** TASKS.md Phase 1.9.4 for full specification

---

## Performance Considerations

### Current Scale Targets (MVP)

- **Users:** 1,000 beta users
- **Transactions:** ~10K per user (annual)
- **Sync Frequency:** Every 4 hours
- **Feed Items:** ~50 per user per week

### Future Optimization Triggers

**When to add read replicas:**
- Query latency > 500ms p95
- Read throughput > 80% provisioned capacity

**When to add caching (ElastiCache):**
- Repeated queries for same data
- DynamoDB read costs > $50/month
- User complaints about loading times

**When to add CQRS:**
- Read/write ratio > 10:1
- Complex aggregations taking > 1s
- Feed generation causing write throttling

---

*Last updated: November 14, 2025 by James Flesher*
