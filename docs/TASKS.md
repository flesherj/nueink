# NueInk Development Tasks

**Last Updated:** November 11, 2025
**Project Status:** 🟡 Development (Architectural Refactoring Phase)
**Owner:** James Flesher
**Current Phase:** Phase 0 - Architectural Foundation

---

## 🎯 Vision Quick Reference

**What is NueInk?**
"Instagram for Your Finances" - A social-first personal finance app that transforms money management into a collaborative, engaging experience for couples and families.

**Unique Value Propositions (NO competitor has these):**
1. 🎭 **Social Transaction Feed** - Facebook-style feed with all transactions
2. 💬 **Comments on Transactions** - Discuss spending in context, reduce money fights
3. 👤 **Person Auto-Assignment** - One-time setup, 99% accuracy for "who spent what?"
4. 📸 **Receipt Scanning** - Camera + AWS Textract OCR + auto-matching
5. 📄 **Bill Scanning** - Scan bills, auto-extract details, create reminders

**Target Market:**
- Primary: Couples who argue about money (20M Mint refugees)
- Secondary: Families with teenagers learning finances
- Pricing: $6.99/month (half the price of competitors)

**Key Philosophy:**
- **Zero friction** - Only features requiring minimal user effort
- **Auto-everything** - Auto-assign, auto-categorize, auto-update
- **Social-first** - Make finance engaging, not boring
- **Stupid simple** - "If it's hard, people won't do it"

**Detailed Vision:** See [NUEINK_ASSESSMENT.md](./NUEINK_ASSESSMENT.md), [MARKET_DISRUPTION_ANALYSIS.md](./MARKET_DISRUPTION_ANALYSIS.md), [SIMPLIFIED_MVP_PLAN.md](./SIMPLIFIED_MVP_PLAN.md)

---

## 📊 Progress Overview

### Overall Project Status

**Foundation:** ████████░░ 80% (Existing infrastructure reusable)
**Phase 0 (Architecture):** ███░░░░░░░ 30% (In progress)
**Phase 1 (Integration):** ░░░░░░░░░░ 0%
**Phase 2 (Social Feed):** ░░░░░░░░░░ 0%
**Phase 3 (Intelligence):** ░░░░░░░░░░ 0%
**Phase 4 (Receipts/Bills):** ░░░░░░░░░░ 0%
**Phase 5 (Polish):** ░░░░░░░░░░ 0%

**Timeline to MVP:** 6-8 weeks remaining

### Key Milestones

- ✅ **Pivot Decision** (November 2025) - Committed to financial focus
- ✅ **Infrastructure Assessment** (80% reusable)
- ✅ **Strategic Planning** (15 comprehensive docs created)
- ✅ **YNAB Package** (Created integration foundation)
- 🔄 **Architectural Refactoring** (30% - separating RN from Lambda)
- ⏭️ **First Transaction Sync** (Target: Week 2)
- ⏭️ **Social Feed MVP** (Target: Week 4)
- ⏭️ **Beta Launch** (Target: Week 8)

---

## 🚀 Current Sprint (Week 1: Nov 11-17, 2025)

### In Progress 🔄

- [x] **Research existing architecture** (Nov 11 - Completed)
  - Analyzed aws vs core package separation
  - Identified circular dependency issues
  - Decided on repository pattern with generics

- [ ] **Create TASKS.md master file** (Nov 11 - In Progress)
  - Single source of truth for all work
  - Comprehensive task tracking
  - Context for future sessions

- [ ] **Move repository interfaces to core**
  - Create `packages/core/repositories/` directory
  - Move BaseRepository → Repository.ts with generics
  - Move PaginationResult type
  - Update all services to use local interfaces
  - Status: Ready to start

### Blocked 🚫

*No blocked tasks currently*

### Up Next ⏭️

1. Complete TASKS.md creation
2. Begin Phase 0 architectural refactoring
3. Test repository pattern with AccountService
4. Update native app to use core services only

---

## ✅ Completed Work (Latest First)

### November 11, 2025

- ✅ **Built FinancialService** (in-memory implementation)
  - Service orchestrates financial data syncing
  - Uses FinancialIntegrationFactory
  - Caches accounts and transactions
  - [Commit: f847bf4](../../)

- ✅ **Built FinancialIntegrationFactory** (core package)
  - Abstract factory for creating integrations
  - Platform-agnostic pattern
  - Supports YNAB, Plaid, Manual providers
  - [Commit: f847bf4](../../)

- ✅ **Built MetricsService** (CloudWatch EMF logging)
  - Free metrics via structured JSON logs
  - Tracks sync success/failure, duration
  - Categorizes errors for filtering
  - [Commit: f847bf4](../../)

- ✅ **Fixed React Native build issues**
  - Separated Lambda-only code from RN exports
  - EventBridgePublisher not exported from main package
  - Removed AWS SDK from RN bundle
  - [Commit: 48fda7d, bfab961](../../)

- ✅ **Removed FinancialAccountSubtype** (architectural decision)
  - Switched to granular account types
  - 17 specific types instead of abstract categories
  - Updated all models, converters, tests
  - [Commit: e407943](../../)

- ✅ **Added @aws-sdk/client-eventbridge dependency**
  - Required for EventBridgePublisher
  - [Commit: e407943](../../)

### November 10, 2025

- ✅ **Created YNAB integration package**
  - YnabIntegration class with full implementation
  - YnabAccountConverter (milliunits → cents)
  - YnabTransactionConverter
  - [Commit: df636ad](../../)

- ✅ **Created Plaid integration package** (structure only)
  - Package scaffolding
  - Ready for implementation

### November 8-9, 2025

- ✅ **Moved strategic analysis docs to repo**
  - 15 comprehensive analysis documents
  - Market research, feature analysis, cost projections
  - [See /docs directory](../)

---

## 📋 Phase 0: Architectural Foundation (CURRENT)

**Goal:** Separate React Native code (@nueink/core) from Lambda code (@nueink/aws)

**Why:** Clean architecture, no AWS SDK in RN bundle, testable services

**Success Criteria:**
- ✅ Native app imports ONLY from @nueink/core
- ✅ Services return domain models (not entities)
- ✅ Repository pattern with generic interfaces
- ✅ AWS SDK packages not in React Native bundle
- ✅ Type-safe metrics across all platforms (Lambda, iOS, Android, Web)

### 0.0 Metrics Infrastructure (Foundational - Do First)

**Goal:** Type-safe, platform-agnostic metrics for investor visibility and operational monitoring

**Why:**
- Investor metrics from day 1: signups, logins, DAU/MAU, retention, platform breakdown
- Environment separation: dev vs staging vs prod data (clean investor dashboards)
- Operational visibility: performance, errors, data quality
- Foundation before adding auth metrics to Lambdas

**Architecture Decisions (Nov 11, 2025):**
- Metric definitions in `@nueink/core` (platform-agnostic, shared types)
- MetricsService interface in `@nueink/core` (contract for all implementations)
- CloudWatchMetricsService in `@nueink/aws` (Lambda implementation with EMF)
- Future: AmplitudeMetricsService for mobile, WebMetricsService for web
- Platform auto-detection in constructor (lambda, ios, android, web)
- Environment auto-detection from Amplify env (dev, staging, prod)
- Separate CloudWatch namespaces per environment (nueink-dev, nueink-prod)
- Session tracking: SessionId dimension for user journey analysis
- User properties: Auto-added metadata for segmentation
- Context tracking: Screen/Feature dimensions for all metrics

**Dimensions Strategy:**
- **Static** (set in constructor): Platform, Environment, AppVersion
- **Per-session** (setSessionId): SessionId
- **Per-user** (setUserProperties): UserId, SignupDate, HasPartner, etc.
- **Per-screen** (setContext): Screen, Feature, Flow
- **Per-metric** (record call): Metric-specific dimensions

**Metrics Categories:**
1. **Auth**: USER_SIGNUP, USER_LOGIN, SIGNUP_DURATION, SIGNUP_FAILURE
2. **Sync**: SYNC_SUCCESS, SYNC_FAILURE, SYNC_DURATION, ACCOUNTS_SYNCED, TRANSACTIONS_SYNCED
3. **Engagement**: SCREEN_VIEWED, SESSION_DURATION, FEATURE_USED, DAILY_ACTIVE_USER
4. **Funnel**: ONBOARDING_STEP_COMPLETED, TIME_TO_FIRST_VALUE, INTEGRATION_CONNECTED
5. **Social**: COMMENT_POSTED, TRANSACTION_DISCUSSED, MENTION_USED, FAMILY_MEMBER_INVITED
6. **Operational**: API_LATENCY, ERROR_OCCURRED, LAMBDA_COLD_START

- [ ] **Create type-safe metric definitions**
  - File: `packages/core/config/metrics.ts`
  - Types:
    - `MetricDefinition<TName, TDimensions, TUnit>` interface
    - `MetricUnit = 'Count' | 'Milliseconds' | 'Percent' | 'Bytes'`
    - Helper: `defineMetric()` for type inference
  - Exports:
    - `METRIC_DEFINITIONS` object (all metrics)
    - `STANDARD_DIMENSIONS` object (PLATFORM, ENVIRONMENT, PROVIDER, etc.)
    - Type helpers: `MetricKey`, `MetricDimensions<K>`, `MetricDimensionsObject<K>`
  - Initial metrics: Auth (4), Sync (5), Engagement (4), Funnel (3), Social (4)
  - Acceptance: Full TypeScript autocomplete, no runtime dependencies

- [ ] **Create MetricsService interface**
  - File: `packages/core/services/MetricsService.ts`
  - Interface methods:
    - `record<K extends MetricKey>()` - Type-safe metric recording
    - `recordBatch()` - Bulk operations
    - `setSessionId(sessionId: string)` - Session tracking
    - `setUserProperties(properties: UserProperties)` - User segmentation
    - `setContext(context: { screen?, feature?, flow? })` - Screen/feature context
    - `startOperation(name, dimensions)` - Returns Operation helper
  - Types:
    - `UserProperties` interface
    - `MetricContext` interface
    - `Operation` interface (succeed/fail methods)
  - Acceptance: Contract defines all platform implementations

- [ ] **Refactor CloudWatchMetricsService**
  - File: `packages/aws/services/CloudWatchMetricsService.ts`
  - Implement: `MetricsService` interface from core
  - Constructor:
    - Auto-detect environment from `process.env.AWS_BRANCH`, `AMPLIFY_ENVIRONMENT`
    - Set namespace: `${baseNamespace}-${environment}` (e.g., "nueink-dev")
    - Set default dimensions: `{ Platform: 'lambda', Environment: environment }`
  - State management:
    - `sessionId?: string` (for operation tracking)
    - `userProperties: Record<string, any>` (metadata)
    - `context: Record<string, string>` (screen/feature)
  - Implement all interface methods
  - Keep EMF format (console.log JSON)
  - Remove old methods: `recordSyncSuccess()`, `recordSyncFailure()`, etc.
  - Acceptance: Implements interface, environment separation works

- [ ] **Add Operation helper**
  - Class: `CloudWatchOperation implements Operation`
  - Methods:
    - `succeed(metadata?)` - Records *_COMPLETED + *_DURATION
    - `fail(error)` - Records *_FAILED + *_DURATION + ErrorType
  - Usage: `const op = metrics.startOperation('sync', { Provider: 'ynab' })`
  - Acceptance: Tracks start/end/duration automatically

- [ ] **Update FinancialService usage**
  - File: `packages/core/services/FinancialService.ts`
  - Update: Use new `record()` API instead of old methods
  - Example: `metrics.record('SYNC_SUCCESS', 1, { UserId, Provider, Status })`
  - Add: Operation tracking for sync operations
  - Acceptance: All metrics calls updated, compiles without errors

- [ ] **Export from packages**
  - File: `packages/core/index.ts`
    - Export: `METRIC_DEFINITIONS`, `STANDARD_DIMENSIONS`
    - Export: `MetricsService` interface
    - Export: Type helpers
  - File: `packages/aws/index.ts`
    - Export: `CloudWatchMetricsService` (NOT default export)
    - Document: "Lambda-only, do not import in React Native"
  - Acceptance: Can import from correct packages

- [ ] **Test in sandbox**
  - Update: Post-confirmation Lambda to use new metrics (quick test)
  - Deploy: `yarn sandbox:dev`
  - Trigger: User signup (create test account)
  - Verify: CloudWatch Logs show EMF format
  - Verify: Metrics in CloudWatch console
  - Check: Namespace = "nueink-dev"
  - Check: Dimensions include Platform="lambda", Environment="dev"
  - Acceptance: End-to-end flow works

- [ ] **Create CloudWatch dashboard**
  - Create: Dev dashboard in CloudWatch console
  - Widgets:
    - User Signups (by Provider)
    - User Logins (by Provider)
    - Sync Success Rate
    - Sync Duration P95
  - Save: Dashboard JSON for version control
  - Acceptance: Can view metrics in dashboard

- [ ] **Commit metrics infrastructure**
  - Message: "Add type-safe metrics infrastructure with platform/environment detection"
  - Files:
    - `packages/core/config/metrics.ts`
    - `packages/core/services/MetricsService.ts`
    - `packages/aws/services/CloudWatchMetricsService.ts` (refactored)
    - Updated: FinancialService usage
    - Updated: Package exports
  - Document: Architecture decision in commit body
  - Acceptance: Clean commit with all changes

### 0.1 Repository Pattern Implementation

- [x] **Research current architecture** (Completed Nov 11)
  - Analyzed aws/core dependencies
  - Identified Schema import issues
  - Decided on generic repository interfaces

- [ ] **Create repository directory structure**
  - Create `packages/core/repositories/` directory
  - Create `packages/core/repositories/index.ts`
  - Acceptance: Directory exists with proper exports

- [ ] **Convert BaseRepository to generic**
  - Move `packages/aws/repositories/BaseRepository.ts` → `packages/core/repositories/Repository.ts`
  - Convert to generic: `Repository<T>`, `PaginatedRepository<T>`
  - Move `PaginationResult` type to core
  - Acceptance: Interfaces use generics, no aws dependencies

- [ ] **Move repository interfaces to core**
  - Move AccountRepository interface
  - Move OrganizationRepository interface
  - Move MembershipRepository interface
  - Move InstitutionRepository interface
  - Move FinancialAccountRepository interface
  - Move TransactionRepository interface
  - Move CommentRepository interface
  - Move PersonRepository interface
  - Move BudgetRepository interface
  - Move DebtRepository interface
  - Acceptance: All 10 interfaces in core/repositories/interfaces/

- [ ] **Update core services**
  - Update AccountService to import from `../repositories/`
  - Update OrganizationService
  - Update MembershipService
  - Update InstitutionService
  - Update FinancialAccountService
  - Update TransactionService
  - Update CommentService
  - Update PersonService
  - Update BudgetService
  - Update DebtService
  - Acceptance: All services import local interfaces

- [ ] **Update aws repository implementations**
  - Update all `Amplify*Repository.ts` to import from `@nueink/core`
  - Verify implementations still work
  - Acceptance: No TypeScript errors, implementations compile

- [ ] **Commit repository refactoring**
  - Message: "Move repository interfaces to core with generic pattern"
  - Include: All moved files, updated imports

### 0.2 Amplify Configuration Migration

- [ ] **Move NueInkAmplifyBuilder to core**
  - Move `packages/aws/NueInkAmplifyBuilder.ts` → `packages/core/config/AmplifyConfig.ts`
  - Update import for `amplify_outputs.json`: `import from '@nueink/aws/amplify_outputs.json'`
  - Acceptance: File moved, imports updated

- [ ] **Update package exports**
  - Export AmplifyConfig from `packages/core/index.ts`
  - Remove NueInkAmplifyBuilder from `packages/aws/index.ts`
  - Acceptance: Exports updated in both packages

- [ ] **Update native app**
  - Change import in `apps/native/app/_layout.tsx`
  - From: `import { NueInkAmplifyBuilder } from '@nueink/aws'`
  - To: `import { AmplifyConfig } from '@nueink/core'`
  - Update usage: `AmplifyConfig.builder()...`
  - Acceptance: Native app builds without errors

- [ ] **Test Amplify configuration**
  - Verify native app connects to backend
  - Verify auth still works
  - Acceptance: Can sign in and load data

- [ ] **Commit Amplify migration**
  - Message: "Move Amplify configuration to core package"

### 0.3 Service Layer Implementation

- [ ] **Create AccountService in core**
  - Create `packages/core/services/AccountService.ts`
  - Constructor takes `Repository<AccountEntity>` parameter
  - Implement `getAccount(id: string): Promise<Account>`
  - Implement `getAccounts(orgId: string): Promise<Array<Account>>`
  - Use `AccountConverter` for Entity → Domain conversion
  - Acceptance: Returns domain `Account`, not `AccountEntity`

- [ ] **Export AccountService**
  - Export from `packages/core/services/index.ts`
  - Acceptance: Can import from core

- [ ] **Create service instantiation pattern**
  - Decide: Factory, DI container, or direct instantiation?
  - Document pattern in comments
  - Create example usage
  - Acceptance: Clear pattern for service creation

- [ ] **Commit AccountService**
  - Message: "Add AccountService with repository pattern"
  - Include: Service file, exports, usage example

### 0.4 Native App Refactoring

- [ ] **Update protected layout**
  - File: `apps/native/app/(protected)/_layout.tsx`
  - Remove: `import { AccountEntity, AccountApi } from '@nueink/aws'`
  - Add: `import { Account, AccountService } from '@nueink/core'`
  - Update state: `useState<AccountEntity>()` → `useState<Account>()`
  - Refactor loadAccount() to use AccountService
  - Acceptance: No imports from @nueink/aws

- [ ] **Verify AccountProvider**
  - Check `@nueink/ui/AccountProvider` type
  - Update if using AccountEntity instead of Account
  - Acceptance: Uses domain Account type

- [ ] **Test native app**
  - Run `yarn ios` or `yarn android`
  - Verify app builds
  - Verify account loads correctly
  - Verify no console errors
  - Acceptance: App works as before

- [ ] **Commit native app refactoring**
  - Message: "Native app now uses core services only"
  - Include: All updated files

### 0.5 Final Cleanup

- [ ] **Evaluate AccountApi**
  - Decision: Keep REST API or use GraphQL via repositories?
  - If keeping: Document reason
  - If removing: Delete `packages/aws/api/AccountApi.ts`
  - Acceptance: Clear decision documented

- [ ] **Update aws package exports**
  - File: `packages/aws/index.ts`
  - Verify exports: models, services (MetricsService only)
  - Document Lambda-only imports in comments
  - Acceptance: Only RN-safe code exported

- [ ] **Verify bundle analysis**
  - Check native app bundle (if possible)
  - Verify no AWS SDK packages included
  - Acceptance: Clean bundle

- [ ] **Document architecture**
  - Update CLAUDE.md with new patterns
  - Add comments explaining separation
  - Acceptance: Future developers understand structure

- [ ] **Commit cleanup**
  - Message: "Complete clean architecture separation"
  - Include: Documentation updates

- [ ] **Mark Phase 0 complete**
  - Update this file with completion date
  - Move to Phase 1

---

## 📋 Phase 1: Financial Data Sync (Weeks 1-2)

**Goal:** Event-driven real-time sync for YNAB/Plaid data with AppSync subscriptions

**Why:** Real-time UX ("Instagram for Finances"), event-driven architecture learning, scalable foundation

**Architecture Decisions (Nov 11, 2025):**
- ✅ EventBridge for event routing (not SQS)
- ✅ AppSync subscriptions for real-time updates (not custom WebSocket)
- ✅ Direct to Transaction table (cache tables added later if needed)
- ✅ MetricsService with CloudWatch EMF (free metrics, operational visibility)
- ✅ User-triggered + scheduled background sync

**Success Criteria:**
- ✅ EventBridge triggers sync every 15 minutes (configurable)
- ✅ Lambdas process users in parallel (auto-scale)
- ✅ YNAB data syncs to Transaction table directly
- ✅ Metrics published to CloudWatch (EMF)
- ✅ Real-time UI updates via AppSync (Transaction.onCreate subscription)
- ✅ User sees transactions appear without pull-to-refresh

### 1.1 Data Models for Sync

- [ ] **Review existing Transaction model**
  - Check: `packages/core/models/Transaction.ts`
  - Check: `packages/aws/models/Transaction.ts`
  - Verify fields support sync: syncedAt, syncSource, externalId
  - Acceptance: Know what needs to be added

- [ ] **Extend Transaction model if needed**
  - Add: syncedAt (timestamp of last sync)
  - Add: syncSource (ynab, plaid, manual)
  - Add: externalId (provider's transaction ID for deduplication)
  - Update: Amplify schema
  - Acceptance: Model supports sync metadata

- [ ] **Create IntegrationConfig model**
  - File: `packages/aws/models/IntegrationConfig.ts`
  - Fields: userId, provider, credentials (encrypted), enabled, lastSyncAt, createdAt, updatedAt
  - Create entity type
  - Acceptance: TypeScript interface defined

- [ ] **Add IntegrationConfig to Amplify schema**
  - File: `packages/aws/amplify/data/resource.ts`
  - Add IntegrationConfig model definition
  - Set authorization rules (owner-based)
  - Add index: userId (for querying user's integrations)
  - Acceptance: Schema compiles

- [ ] **Generate types**
  - Run: `yarn sandbox:dev` to generate types
  - Verify: Generated types in `amplify_outputs.json`
  - Acceptance: No TypeScript errors

- [ ] **Commit data models**
  - Message: "Add IntegrationConfig and extend Transaction for sync"
  - Include: Model files, schema updates

### 1.2 Lambda Integration Factory

- [ ] **Create Lambda factory**
  - File: `packages/aws/functions/shared/LambdaFinancialIntegrationFactory.ts`
  - Extend: `FinancialIntegrationFactory` from core
  - Implement: `createYnabIntegration()`
  - Implement: `createPlaidIntegration()`
  - Implement: `createManualIntegration()` as stub
  - Acceptance: Factory instantiates integrations

- [ ] **Test factory**
  - Create test script
  - Verify YNAB integration works
  - Acceptance: Can create and use integrations

- [ ] **Commit factory**
  - Message: "Add Lambda integration factory"

### 1.3 Parameter Store Service

- [ ] **Create ParameterStoreService**
  - File: `packages/aws/services/ParameterStoreService.ts`
  - Method: `getProviderConfig(provider)` - global config
  - Method: `getUserCredentials(userId, provider)` - encrypted credentials
  - Method: `saveUserCredentials(userId, provider, creds)` - with encryption
  - Use: AWS Systems Manager client
  - Acceptance: Can read/write parameters

- [ ] **Document parameter naming**
  - Add comments with naming convention
  - Global: `/nueink/{provider}/config`
  - User: `/nueink/{userId}/{provider}/credentials`
  - Acceptance: Clear documentation

- [ ] **Commit Parameter Store service**
  - Message: "Add Parameter Store service for credentials"

### 1.4 Enqueue Lambda

- [ ] **Create Lambda directory**
  - Create: `packages/aws/amplify/functions/enqueue-sync-users/`
  - Acceptance: Directory exists

- [ ] **Create Lambda resource**
  - File: `resource.ts`
  - Use: `defineFunction()`
  - Configure: EventBridge schedule (every 15 min)
  - Acceptance: Function defined

- [ ] **Implement Lambda handler**
  - File: `handler.ts`
  - Logic:
    1. Query all users with enabled integrations
    2. For each user: publish `user.sync.requested` event
    3. Use EventBridgePublisher
    4. Log counts
  - Acceptance: Handler compiles

- [ ] **Test Lambda locally**
  - Create test event
  - Run handler
  - Verify events published
  - Acceptance: Works as expected

- [ ] **Add to backend**
  - File: `packages/aws/amplify/backend.ts`
  - Import and add function
  - Acceptance: Backend compiles

- [ ] **Commit enqueue Lambda**
  - Message: "Add enqueue-sync-users Lambda"

### 1.5 Sync Worker Lambda

- [ ] **Create Lambda directory**
  - Create: `packages/aws/amplify/functions/sync-user-data/`
  - Acceptance: Directory exists

- [ ] **Create Lambda resource**
  - File: `resource.ts`
  - Use: `defineFunction()`
  - Configure: EventBridge trigger (user.sync.requested)
  - Acceptance: Function defined

- [ ] **Implement Lambda handler**
  - File: `handler.ts`
  - Logic:
    1. Receive event with userId, provider
    2. Load IntegrationConfig from DynamoDB
    3. Create FinancialService with factory
    4. Call `syncUserData(config)`
    5. Save results to cache tables
    6. Publish CloudWatch metrics
  - Use: MetricsService for metrics
  - Error handling: Catch and log errors
  - Acceptance: Handler compiles

- [ ] **Test Lambda locally**
  - Create test event
  - Mock DynamoDB data
  - Run handler
  - Verify sync logic
  - Acceptance: Works with test data

- [ ] **Add to backend**
  - File: `packages/aws/amplify/backend.ts`
  - Import and add function
  - Acceptance: Backend compiles

- [ ] **Commit sync worker**
  - Message: "Add sync-user-data worker Lambda"

### 1.6 EventBridge Configuration

- [ ] **Add EventBridge to backend**
  - File: `packages/aws/amplify/backend.ts`
  - Create or use default event bus
  - Acceptance: Event bus configured

- [ ] **Add schedule rule**
  - Create rule: Trigger enqueue-sync-users every 15 min
  - Expression: `rate(15 minutes)`
  - Target: enqueue-sync-users Lambda
  - Acceptance: Rule created

- [ ] **Add event rule**
  - Create rule: Route `user.sync.requested` to sync-user-data
  - Pattern: `{ "source": ["nueink.sync"], "detail-type": ["user.sync.requested"] }`
  - Target: sync-user-data Lambda
  - Acceptance: Rule created

- [ ] **Grant permissions**
  - enqueue-sync-users: Can publish events
  - sync-user-data: Can be invoked by EventBridge
  - Both: Can access DynamoDB tables
  - Acceptance: IAM policies configured

- [ ] **Commit EventBridge config**
  - Message: "Configure EventBridge for sync orchestration"

### 1.7 Real-Time Client Integration

- [ ] **Add AppSync subscription to native app**
  - File: `apps/native/app/(protected)/transactions/index.tsx` (or wherever)
  - Subscribe: `client.models.Transaction.onCreate()`
  - Filter: By organizationId
  - Update: State to add new transactions at top
  - Acceptance: Transactions appear in real-time

- [ ] **Test real-time flow**
  - Manually insert Transaction record
  - Verify: Appears in app immediately (no refresh)
  - Acceptance: Real-time updates work

- [ ] **Add loading states**
  - Show: "Syncing..." indicator when sync triggered
  - Show: Success toast when sync completes
  - Handle: Offline/error states
  - Acceptance: Good UX

- [ ] **Commit real-time UI**
  - Message: "Add real-time transaction updates via AppSync"

### 1.8 Testing & Validation

- [ ] **Create YNAB test script**
  - File: `packages/ynab/scripts/test-integration.ts`
  - Use real YNAB token (from env var)
  - Test: `getStatus()` - verify connection
  - Test: `getAccounts()` - fetch accounts
  - Test: `getTransactions()` - fetch last 30 days
  - Verify: Converters work (milliunits → cents)
  - Log: Results to console
  - Acceptance: Script runs successfully

- [ ] **Insert test IntegrationConfig**
  - Manually create IntegrationConfig in DynamoDB
  - Use your YNAB credentials
  - Enable: true
  - Acceptance: Test record exists

- [ ] **Deploy to sandbox**
  - Run: `yarn sandbox:dev`
  - Verify: All Lambdas deployed
  - Verify: EventBridge rules created
  - Acceptance: Sandbox running

- [ ] **Trigger enqueue Lambda manually**
  - Use AWS Console or CLI
  - Invoke enqueue-sync-users
  - Check CloudWatch Logs
  - Acceptance: Events published

- [ ] **Verify sync worker runs**
  - Check CloudWatch Logs for sync-user-data
  - Verify: Data in Transaction table
  - Verify: Metrics in CloudWatch
  - Verify: Real-time update in app
  - Acceptance: End-to-end flow works

- [ ] **Create CloudWatch dashboard**
  - Metrics: Sync success rate, duration P95, error count by provider
  - Graphs: 24hr, 7d, 30d views
  - Acceptance: Operational visibility

- [ ] **Verify data quality**
  - Query Transaction table
  - Verify: Amounts in cents
  - Verify: Dates correct
  - Verify: No duplicates (externalId working)
  - Acceptance: Data looks correct

- [ ] **Commit testing**
  - Message: "Sync system tested and working end-to-end"
  - Include: Test scripts, documentation

- [ ] **Mark Phase 1 complete**
  - Update progress
  - Document completion date

---

## 📋 Phase 1.9: Gift Cards & Widget Foundation (1-2 Days)

**Goal:** Low-effort, high-value additions that increase daily engagement

**Why Now:**
- Gift cards = 5-minute model extension, huge UX win
- Widget groundwork = enables daily engagement before social features
- Both increase "stickiness" and investor metrics (DAU/MAU)

**Success Criteria:**
- ✅ Users can track gift cards as assets
- ✅ iOS/Android widgets show financial snapshot on home screen
- ✅ Widget updates after sync (real-time awareness)
- ✅ Privacy mode: Widget respects lock screen
- ✅ Zero backend work (reads existing data)

### 1.9.1 Gift Card Support

**Goal:** Track gift cards that people always lose and forget

**Time Estimate:** 2-3 hours

- [ ] **Add gift_card account type**
  - File: `packages/core/models/types.ts`
  - Add: `'gift_card'` to `FinancialAccountType` union
  - Acceptance: Type compiles

- [ ] **Add giftCardDetails field**
  - File: `packages/core/models/FinancialAccount.ts`
  - Add optional field:
    ```typescript
    giftCardDetails?: {
      merchant: string;        // "Starbucks", "Amazon", etc.
      cardNumber?: string;     // Last 4 digits
      expirationDate?: Date;
      balance: number;         // Current value in cents
    };
    ```
  - Acceptance: Model supports gift card metadata

- [ ] **Update FinancialAccount entity**
  - File: `packages/aws/models/FinancialAccount.ts`
  - Add: giftCardDetails JSON field (optional)
  - Acceptance: Entity matches domain model

- [ ] **Update Amplify schema**
  - File: `packages/aws/amplify/data/resource.ts`
  - Add: giftCardDetails as JSON field
  - Acceptance: Schema compiles

- [ ] **Create "Add Gift Card" screen**
  - File: `apps/native/app/(protected)/accounts/add-gift-card.tsx`
  - Form fields:
    - Merchant name (text input with autocomplete)
    - Balance (currency input)
    - Card number last 4 (optional)
    - Expiration date (optional)
  - Action: Creates FinancialAccount with type='gift_card'
  - Acceptance: Can manually add gift cards

- [ ] **Update Account list UI**
  - File: `apps/native/app/(protected)/accounts/index.tsx`
  - Add: Gift card icon/badge
  - Display: Merchant name + current balance
  - Sort: Show gift cards in separate section or mixed
  - Acceptance: Gift cards appear in UI

- [ ] **Update Account detail screen**
  - Show: Merchant, balance, expiration
  - Action: Edit balance (manual update)
  - Action: Delete when used/expired
  - Acceptance: Can manage gift card details

- [ ] **Test gift card flow**
  - Add: Test gift cards (Starbucks $25, Amazon $50)
  - Verify: Appears in account list
  - Verify: Balance included in net worth
  - Acceptance: Works end-to-end

- [ ] **Commit gift card support**
  - Message: "Add gift card tracking as financial account type"
  - Include: Model updates, UI screens

### 1.9.2 Widget Infrastructure

**Goal:** Display financial snapshot on device home screen (like weather widget)

**Time Estimate:** 6-8 hours

**Phase 1.9 Scope:** Read-only widget showing balances, spending, budget status

**Deferred to later:** Check-in tracking, interactive widgets, biometric unlock

- [ ] **Create WidgetSnapshot model**
  - File: `packages/core/models/WidgetSnapshot.ts`
  - Fields:
    ```typescript
    export interface WidgetSnapshot {
      totalBalance: number;          // Total across all accounts
      todaySpending: number;         // Sum of today's transactions
      budgetStatus: {
        percentUsed: number;         // % of monthly budget used
        remaining: number;           // Amount remaining
      };
      topAccounts: Array<{          // Top 3 accounts to display
        name: string;
        balance: number;
        type: FinancialAccountType;
      }>;
      lastUpdated: Date;
    }
    ```
  - Acceptance: Type defined

- [ ] **Create WidgetDataService**
  - File: `packages/core/services/WidgetDataService.ts`
  - Method: `calculateSnapshot(accounts, transactions, budgets): WidgetSnapshot`
  - Logic:
    - Sum all account balances
    - Filter today's transactions (by date)
    - Calculate budget % (monthly spending / monthly budget)
    - Select top 3 accounts by balance
  - Acceptance: Generates snapshot from data

- [ ] **Create WidgetStorage abstraction**
  - File: `packages/core/storage/WidgetStorage.ts`
  - Interface:
    ```typescript
    export interface WidgetStorage {
      saveSnapshot(snapshot: WidgetSnapshot): Promise<void>;
      getSnapshot(): Promise<WidgetSnapshot | null>;
    }
    ```
  - Acceptance: Platform-agnostic interface

- [ ] **Implement iOS WidgetStorage**
  - File: `apps/native/ios/WidgetStorage.swift` (or Expo module)
  - Use: App Groups for shared data
  - Format: JSON in shared UserDefaults
  - Acceptance: Can save/load from widget extension

- [ ] **Implement Android WidgetStorage**
  - File: `apps/native/android/WidgetStorage.kt` (or Expo module)
  - Use: Shared Preferences
  - Format: JSON
  - Acceptance: Can save/load from widget

- [ ] **Update app to persist widget data**
  - File: Update sync completion handler
  - On sync complete:
    1. Get latest accounts, transactions, budgets
    2. Calculate snapshot via WidgetDataService
    3. Save to WidgetStorage
  - Acceptance: Data updates after every sync

- [ ] **Create iOS widget extension**
  - File: `apps/native/ios/WidgetExtension/`
  - Display:
    - Large card: Total balance (big number)
    - Small cards: Today's spending, Budget %
    - Bottom: "Last updated: 5 min ago"
  - Refresh: Every 15 min (iOS limit) + on app open
  - Tap: Opens app to dashboard
  - Acceptance: Widget appears on iOS home screen

- [ ] **Create Android widget**
  - File: `apps/native/android/app/src/main/java/widgets/NueInkWidget.kt`
  - Display: Same layout as iOS
  - Refresh: Similar behavior
  - Tap: Opens app
  - Acceptance: Widget appears on Android home screen

- [ ] **Add privacy/security settings**
  - Setting: "Show balances in widget" toggle (default: OFF)
  - When OFF: Widget shows "***" instead of numbers
  - Note: Biometric unlock NOT possible in widgets (iOS/Android limitation)
  - Acceptance: Privacy-conscious design

- [ ] **Add widget customization**
  - Setting: Choose which accounts to show in widget
  - Setting: Show net worth vs total balance
  - Setting: Dark mode support
  - Acceptance: User can customize widget

- [ ] **Test widget flow**
  - iOS:
    - Add widget to home screen
    - Verify: Shows current data
    - Trigger sync in app
    - Verify: Widget updates within 15 min
  - Android: Same tests
  - Acceptance: Works on both platforms

- [ ] **Add "Setup Widget" onboarding**
  - Screen: After first sync, prompt to add widget
  - Show: Platform-specific instructions
  - Demo: Screenshot of where to find widget
  - Acceptance: Users know how to add widget

- [ ] **Commit widget infrastructure**
  - Message: "Add home screen widget for financial awareness"
  - Include: Services, storage, widget extensions, settings

### 1.9.3 Testing & Polish

- [ ] **Test gift cards + widget together**
  - Add: Gift cards to account
  - Verify: Included in widget total balance
  - Verify: Shows in "top accounts" if balance high enough
  - Acceptance: Integration works

- [ ] **Update onboarding flow**
  - After YNAB sync: Show success + prompt to add widget
  - Mention: "Check your finances without opening the app"
  - Acceptance: Good UX for new users

- [ ] **Performance testing**
  - Widget refresh time: < 1 second
  - Widget battery impact: Negligible (leverage OS scheduling)
  - Acceptance: No performance issues

- [ ] **Mark Phase 1.9 complete**
  - Update progress
  - Document completion date

---

## 📋 Phase 2: Social Financial Feed (Weeks 3-4)

**Goal:** Instagram-style feed for financial activities with comments

**Why:** Social engagement, reduce money fights, daily usage

**Reference:** [SOCIAL_FEED_ANALYSIS.md](./SOCIAL_FEED_ANALYSIS.md)

**Architecture Decisions (Nov 11, 2025):**
- ✅ Dedicated FeedItem table (not client-side aggregation of multiple tables)
- ✅ DynamoDB Streams trigger Feed Generation Lambda
- ✅ Single AppSync subscription: `FeedItem.onCreate()` and `FeedItem.onUpdate()`
- ✅ Server-side aggregation (Lambda generates feed items from Transaction/Budget/etc events)
- ✅ Feed-specific metadata (isRead, commentCount, reactions)

**Success Criteria:**
- ✅ Feed shows transactions, budget alerts, account updates, milestones
- ✅ Can comment on any feed item
- ✅ @mention support for family members
- ✅ Real-time updates via AppSync subscriptions
- ✅ Infinite scroll works smoothly
- ✅ Comments and reactions appear instantly for all family members

### 2.1 Feed Data Models

- [ ] **Review existing models**
  - Check: Transaction, Budget, Account models
  - Check: Comment model (already exists!)
  - Verify: Fields support feed needs
  - Acceptance: Know what exists

- [ ] **Create FeedItem model (core)**
  - File: `packages/core/models/FeedItem.ts`
  - Type: Union type (TransactionFeed | BudgetAlertFeed | AccountUpdateFeed | MilestoneFeed)
  - Fields: type, timestamp, data, commentCount, reactedBy[]
  - Acceptance: TypeScript types defined

- [ ] **Create FeedItem entity (aws)**
  - File: `packages/aws/models/FeedItem.ts`
  - Entity for DynamoDB storage
  - Fields: feedItemId, type, timestamp, data (JSON), organizationId, personId?, commentCount, etc.
  - Acceptance: Entity defined

- [ ] **Add to Amplify schema**
  - File: `packages/aws/amplify/data/resource.ts`
  - Add FeedItem model
  - Indexes: organizationId, timestamp (for sorting)
  - Authorization: owner-based
  - Acceptance: Schema compiles

- [ ] **Generate types**
  - Run sandbox
  - Verify types generated
  - Acceptance: No errors

- [ ] **Commit feed models**
  - Message: "Add feed item models"

### 2.2 Feed Services

- [ ] **Create FeedService (core)**
  - File: `packages/core/services/FeedService.ts`
  - Method: `getFeed(orgId, limit, cursor)` → paginated feed items
  - Method: `getFeedItem(itemId)` → single item with comments
  - Method: `addComment(itemId, comment)` → add comment
  - Use: Repository pattern
  - Use: CommentService/Repository
  - Acceptance: Service compiles

- [ ] **Create FeedRepository interface (core)**
  - File: `packages/core/repositories/interfaces/FeedRepository.ts`
  - Extends: `PaginatedRepository<FeedItemEntity>`
  - Methods: findByOrganization, findByPerson, etc.
  - Acceptance: Interface defined

- [ ] **Create AmplifyFeedRepository (aws)**
  - File: `packages/aws/repositories/AmplifyFeedRepository.ts`
  - Implements: FeedRepository
  - Use: GraphQL client
  - Query: Sort by timestamp descending
  - Acceptance: Implementation works

- [ ] **Implement feed aggregation logic**
  - Combine sources: Transactions, Budgets, Accounts, Milestones
  - Sort by timestamp
  - Return unified feed
  - Acceptance: Feed shows mixed content

- [ ] **Commit feed service**
  - Message: "Add feed service layer"

### 2.3 Feed Generation Lambda

- [ ] **Create Lambda directory**
  - Create: `packages/aws/amplify/functions/generate-feed-items/`
  - Acceptance: Directory exists

- [ ] **Create Lambda resource**
  - File: `resource.ts`
  - Trigger: DynamoDB streams
  - Sources: Transaction table, Budget table, Account table
  - Acceptance: Function defined

- [ ] **Implement handler**
  - File: `handler.ts`
  - Logic: Receive DynamoDB stream event
  - For Transaction: Create TransactionFeed item
  - For Budget exceeded: Create BudgetAlertFeed item
  - For Account connected: Create AccountUpdateFeed item
  - For Goal reached: Create MilestoneFeed item
  - Save to FeedItem table
  - Acceptance: Handler compiles

- [ ] **Add to backend**
  - File: `packages/aws/amplify/backend.ts`
  - Configure DynamoDB streams
  - Grant permissions
  - Acceptance: Lambda connected to streams

- [ ] **Test Lambda**
  - Insert test transaction
  - Verify feed item created
  - Acceptance: Works end-to-end

- [ ] **Commit feed generation**
  - Message: "Add feed generation Lambda"

### 2.4 Feed UI Components

- [ ] **Create FeedItem component**
  - File: `packages/ui/components/FeedItem.tsx`
  - Props: feedItem (union type)
  - Render: Different views for each type
    - TransactionFeed: Icon, merchant, amount, time ago
    - BudgetAlertFeed: Warning icon, message, progress bar
    - AccountUpdateFeed: Success icon, account name, balance
    - MilestoneFeed: Celebration icon, message, confetti?
  - Show: Comment count badge
  - Show: Like/react button
  - Acceptance: Renders all types correctly

- [ ] **Create FeedItemComments component**
  - File: `packages/ui/components/FeedItemComments.tsx`
  - Show: List of comments with avatars
  - Show: Commenter name, time ago
  - Show: Add comment input at bottom
  - Support: @mentions with autocomplete
  - Acceptance: Can view and add comments

- [ ] **Style components**
  - Use: React Native Paper theme
  - Match: Instagram-style design
  - Responsive: Works on various screen sizes
  - Acceptance: Looks good

- [ ] **Commit feed components**
  - Message: "Add feed UI components"

### 2.5 Feed Screen

- [ ] **Create feed index screen**
  - File: `apps/native/app/(protected)/feed/index.tsx`
  - Component: FlatList with FeedItems
  - Feature: Pull-to-refresh
  - Feature: Infinite scroll (load more)
  - Feature: Filter options (dropdown or tabs)
    - All
    - Transactions only
    - Budgets only
    - Updates only
  - Use: FeedService to load data
  - Acceptance: Screen renders and scrolls

- [ ] **Create feed detail screen**
  - File: `apps/native/app/(protected)/feed/[itemId].tsx`
  - Show: Full feed item (larger)
  - Show: All comments (FeedItemComments component)
  - Show: Add comment form at bottom
  - If transaction: Show edit button
  - Acceptance: Can view and comment

- [ ] **Add to tab navigation**
  - File: `apps/native/app/(protected)/_layout.tsx`
  - Add: "Feed" tab
  - Icon: Home or activity feed icon
  - Make: Default landing screen?
  - Acceptance: Can navigate to feed

- [ ] **Handle empty states**
  - Show: "No activity yet" message
  - Show: "Connect an account to get started" CTA
  - Acceptance: Handles empty gracefully

- [ ] **Test screen**
  - Verify: Loads data
  - Verify: Scrolling is smooth
  - Verify: Pull-to-refresh works
  - Verify: Can tap to view details
  - Acceptance: Works well

- [ ] **Commit feed screen**
  - Message: "Add feed screen to native app"

### 2.6 Comments & Reactions

- [ ] **Implement comment posting**
  - Use: CommentService
  - Call: `addComment(feedItemId, text)`
  - Update: Comment count on feed item
  - Acceptance: Can post comments

- [ ] **Implement @mentions**
  - Parse: Comment text for @username
  - Autocomplete: Search Person by name
  - Show: Suggested people as typing
  - Tag: Link mention to Person
  - Acceptance: Can @mention family members

- [ ] **Add reactions/likes**
  - Extend: FeedItem model with reactions[]
  - Button: Heart or thumbs up
  - Show: Count of reactions
  - Show: Who reacted
  - Acceptance: Can react to items

- [ ] **Add notifications (simple)**
  - When: Someone comments on your transaction
  - When: Someone @mentions you
  - Show: Badge on feed tab
  - Show: In-app notification list
  - Acceptance: Basic notifications work

- [ ] **Commit comments & reactions**
  - Message: "Add commenting and reactions"

- [ ] **Mark Phase 2 complete**
  - Update progress
  - Document completion date

---

## 📋 Phase 3: Financial Intelligence (Weeks 5-6)

**Goal:** Budgets, dashboards, and insights

**Why:** Help users understand spending, stay on track, achieve goals

**Success Criteria:**
- ✅ Can create and edit budgets manually
- ✅ Automatic spending aggregation by category
- ✅ Visual dashboards with charts
- ✅ Budget alerts when overspending
- ✅ Simple insights ("You spent 20% more this month")

### 3.1 Budget Data Models Review

- [ ] **Review existing Budget model**
  - Check: `packages/core/models/Budget.ts`
  - Check: `packages/aws/models/Budget.ts`
  - Verify: budgetId, organizationId, name, period, categories[]
  - Check if missing: alerts, threshold%, status
  - Acceptance: Know current structure

- [ ] **Extend Budget model if needed**
  - Add: alertsEnabled, thresholdPercent (80%, 90%, 100%)
  - Add: status (active, inactive, archived)
  - Update: Amplify schema
  - Acceptance: Model supports needed features

- [ ] **Commit model updates**
  - Message: "Extend Budget model for alerts"

### 3.2 Budget Services

- [ ] **Create BudgetService (core)**
  - File: `packages/core/services/BudgetService.ts`
  - Method: `getBudgets(orgId)` → list all budgets
  - Method: `createBudget(budget)` → create new
  - Method: `updateBudget(budgetId, updates)` → edit
  - Method: `deleteBudget(budgetId)` → soft delete
  - Method: `getBudgetStatus(budgetId)` → actual vs budget by category
  - Use: Repository pattern
  - Acceptance: Service compiles

- [ ] **Create BudgetRepository interface**
  - If doesn't exist: Create interface
  - Methods: Standard CRUD + getBudgetStatus
  - Acceptance: Interface defined

- [ ] **Create AmplifyBudgetRepository**
  - If doesn't exist: Create implementation
  - Implement all methods
  - Acceptance: Works with GraphQL

- [ ] **Commit budget service**
  - Message: "Add budget service"

### 3.3 Spending Aggregation Lambda

- [ ] **Create Lambda directory**
  - Create: `packages/aws/amplify/functions/aggregate-spending/`
  - Acceptance: Directory exists

- [ ] **Create Lambda resource**
  - File: `resource.ts`
  - Trigger: EventBridge schedule (daily at midnight)
  - Acceptance: Function defined

- [ ] **Implement handler**
  - File: `handler.ts`
  - Logic:
    1. For each active budget
    2. Calculate spending by category (sum transactions)
    3. Compare to budget limits
    4. If threshold exceeded: Generate budget alert
    5. Create FeedItem for alert
    6. Update budget status
  - Acceptance: Handler compiles

- [ ] **Add to backend**
  - Configure schedule
  - Grant permissions
  - Acceptance: Lambda deployed

- [ ] **Test Lambda**
  - Create test budget
  - Add transactions exceeding limit
  - Run Lambda
  - Verify alert generated
  - Acceptance: Works correctly

- [ ] **Commit aggregation Lambda**
  - Message: "Add spending aggregation Lambda"

### 3.4 Budget Creation UI

- [ ] **Create budget creation screen**
  - File: `apps/native/app/(protected)/budgets/create.tsx`
  - Form fields:
    - Budget name (text input)
    - Period (picker: monthly, weekly, yearly)
    - Categories section (list)
  - Add category:
    - Category name (picker or text input)
    - Budget amount (number input)
    - Add button
  - Remove category button
  - Save button
  - Acceptance: Form works

- [ ] **Create category picker**
  - Component: CategoryPicker
  - Load: Existing categories from transactions
  - Allow: Custom category creation
  - Acceptance: Can select or create categories

- [ ] **Test budget creation**
  - Fill form
  - Save budget
  - Verify: Appears in budget list
  - Acceptance: Creation works

- [ ] **Commit budget creation**
  - Message: "Add budget creation screen"

### 3.5 Budget List & Detail UI

- [ ] **Create budget list screen**
  - File: `apps/native/app/(protected)/budgets/index.tsx`
  - Show: All budgets as cards
  - For each budget:
    - Name and period
    - Overall progress bar (total spent / total budget)
    - Color code: green (under), yellow (near), red (over)
    - Tap to view details
  - Show: "Create Budget" button
  - Acceptance: List renders budgets

- [ ] **Create budget detail screen**
  - File: `apps/native/app/(protected)/budgets/[budgetId].tsx`
  - Show: Budget name and period
  - List: Categories with:
    - Category name and icon
    - Budgeted amount
    - Spent amount
    - Progress bar
    - Percentage (e.g., "75% spent")
  - Show: Transactions in each category (collapsible)
  - Button: Edit budget
  - Button: Delete budget
  - Acceptance: Detail view works

- [ ] **Add to navigation**
  - Add: "Budgets" tab or link from dashboard
  - Acceptance: Can navigate to budgets

- [ ] **Commit budget screens**
  - Message: "Add budget screens"

### 3.6 Budget Alerts & Notifications

- [ ] **Implement alert logic**
  - In: Spending aggregation Lambda
  - Thresholds: 80%, 90%, 100%
  - Create: FeedItem when threshold crossed
  - Acceptance: Alerts generated

- [ ] **Add push notifications**
  - Use: Expo notifications or AWS SNS
  - Send: Notification when budget exceeded
  - Content: "You've exceeded your Dining budget"
  - Acceptance: Notifications sent

- [ ] **Add in-app alerts**
  - Show: Badge on Budgets tab
  - Show: Alert banner on dashboard
  - Acceptance: Visual indicators work

- [ ] **Test notifications**
  - Trigger: Budget exceeded
  - Verify: Push notification received
  - Verify: In-app alert shows
  - Acceptance: Alerts work

- [ ] **Commit alerts**
  - Message: "Add budget alert system"

### 3.7 Analytics Services

- [ ] **Create AnalyticsService (core)**
  - File: `packages/core/services/AnalyticsService.ts`
  - Method: `getSpendingByCategory(orgId, dateRange)` → data for pie chart
  - Method: `getSpendingTrend(orgId, months)` → data for line chart
  - Method: `getBudgetPerformance(budgetId)` → data for bar chart
  - Method: `getAccountBalanceHistory(accountId, days)` → data for line chart
  - Optimize: Aggregation queries
  - Acceptance: Service returns chart-ready data

- [ ] **Commit analytics service**
  - Message: "Add analytics service"

### 3.8 Chart Components

- [ ] **Choose chart library**
  - Options: react-native-chart-kit, Victory Native, Recharts
  - Install: Selected library
  - Acceptance: Library installed

- [ ] **Create LineChart component**
  - File: `packages/ui/components/charts/LineChart.tsx`
  - Props: data, labels, colors
  - Responsive: Adapts to screen width
  - Acceptance: Renders line chart

- [ ] **Create PieChart component**
  - File: `packages/ui/components/charts/PieChart.tsx`
  - Props: data (category: amount)
  - Show: Legend with percentages
  - Acceptance: Renders pie chart

- [ ] **Create BarChart component**
  - File: `packages/ui/components/charts/BarChart.tsx`
  - Props: data, labels
  - Show: Horizontal or vertical bars
  - Acceptance: Renders bar chart

- [ ] **Style charts**
  - Use: Theme colors
  - Responsive: Different sizes for phone/tablet
  - Acceptance: Charts look good

- [ ] **Commit chart components**
  - Message: "Add chart components"

### 3.9 Dashboard Screen

- [ ] **Create dashboard screen**
  - File: `apps/native/app/(protected)/dashboard/index.tsx`
  - Overview cards (top):
    - Total balance (sum of all accounts)
    - This month's spending (total)
    - Budget status (X of Y budgets on track)
  - Spending by category (pie chart)
  - Spending trend (line chart, last 6 months)
  - Top merchants (bar chart, top 5)
  - Account balances (list or stacked area chart)
  - Acceptance: Dashboard renders

- [ ] **Make dashboard default screen**
  - Update: Tab navigation
  - Set: Dashboard as landing screen
  - Acceptance: Opens to dashboard

- [ ] **Test dashboard**
  - Verify: All data loads
  - Verify: Charts render correctly
  - Verify: Performance is good
  - Acceptance: Works smoothly

- [ ] **Commit dashboard**
  - Message: "Add dashboard screen"

### 3.10 Insights

- [ ] **Create insights screen**
  - File: `apps/native/app/(protected)/insights/index.tsx`
  - Show: List of insights
  - Examples:
    - "You spent 20% more on Dining this month"
    - "Your savings increased by $500"
    - "You're on track to meet your budget"
  - Generate: Rule-based insights (no ML yet)
  - Acceptance: Insights display

- [ ] **Implement insight generation**
  - Compare: This month vs last month by category
  - Detect: Unusual spending
  - Detect: Progress toward goals
  - Acceptance: Insights are useful

- [ ] **Commit insights**
  - Message: "Add insights screen"

- [ ] **Mark Phase 3 complete**
  - Update progress
  - Document completion date

---

## 📋 Phase 4: Receipt & Bill Intelligence (Weeks 7-8)

**Goal:** Photo receipts, OCR extraction, transaction matching, bill scanning

**Why:** Tax deductions, expense tracking, bill reminders, auto-categorization

**Reference:** [BILL_SCANNING_FEATURE.md](./BILL_SCANNING_FEATURE.md)

**Success Criteria:**
- ✅ Can capture receipt photos with camera
- ✅ AWS Textract extracts: merchant, date, total, line items
- ✅ Receipts auto-match to transactions
- ✅ Can scan bills and create reminders
- ✅ Line-item categorization works

### 4.1 Receipt Data Models

- [ ] **Create Receipt model (core)**
  - File: `packages/core/models/Receipt.ts`
  - Fields:
    - receiptId, transactionId?, userId, organizationId
    - imageUrl (S3 path)
    - merchant, date, totalAmount
    - lineItems: Array<{ description, category, amount }>
    - ocrStatus: pending | processing | completed | failed
    - matchStatus: unmatched | suggested | confirmed
    - createdAt, updatedAt
  - Acceptance: Model defined

- [ ] **Create Receipt entity (aws)**
  - File: `packages/aws/models/Receipt.ts`
  - Entity for DynamoDB
  - Acceptance: Entity defined

- [ ] **Add to Amplify schema**
  - Add Receipt model
  - Indexes: userId, transactionId, ocrStatus
  - Acceptance: Schema compiles

- [ ] **Generate types**
  - Run sandbox
  - Acceptance: Types generated

- [ ] **Commit receipt models**
  - Message: "Add receipt models"

### 4.2 Receipt Upload Flow

- [ ] **Create ReceiptService (core)**
  - File: `packages/core/services/ReceiptService.ts`
  - Method: `uploadReceipt(imageUri, userId, orgId)` → uploads to S3, returns receiptId
  - Method: `getReceipts(userId, status?)` → list receipts
  - Method: `matchReceiptToTransaction(receiptId, transactionId)` → link
  - Method: `updateReceiptLineItems(receiptId, items)` → manual edit
  - Acceptance: Service compiles

- [ ] **Create S3 bucket**
  - File: `packages/aws/amplify/backend.ts`
  - Add: S3 bucket for receipt images
  - Path structure: `receipts/{userId}/{receiptId}.jpg`
  - Permissions: Authenticated users can upload their own
  - Acceptance: Bucket created

- [ ] **Create presigned URL API**
  - Create: Lambda or API endpoint
  - Return: Presigned S3 URL for upload
  - Security: User can only upload to their own folder
  - Acceptance: Can get upload URL

- [ ] **Test upload**
  - Get presigned URL
  - Upload test image
  - Verify: Image in S3
  - Acceptance: Upload works

- [ ] **Commit upload service**
  - Message: "Add receipt upload service"

### 4.3 OCR Processing Lambda

- [ ] **Create Lambda directory**
  - Create: `packages/aws/amplify/functions/process-receipt-ocr/`
  - Acceptance: Directory exists

- [ ] **Create Lambda resource**
  - File: `resource.ts`
  - Trigger: S3 upload event (receipts bucket)
  - Acceptance: Function defined

- [ ] **Implement handler**
  - File: `handler.ts`
  - Logic:
    1. Receive S3 event (new image)
    2. Call AWS Textract `AnalyzeExpense` API
    3. Parse results: merchant, date, total, line items
    4. Save to Receipt entity (update ocrStatus to completed)
    5. Trigger matching Lambda (or call inline)
  - Error handling: Update ocrStatus to failed if error
  - Acceptance: Handler compiles

- [ ] **Add IAM permissions**
  - Lambda: Can call Textract
  - Lambda: Can read from S3
  - Lambda: Can write to DynamoDB
  - Acceptance: Permissions granted

- [ ] **Add to backend**
  - Configure S3 trigger
  - Acceptance: Lambda connected

- [ ] **Test OCR Lambda**
  - Upload test receipt
  - Verify: Lambda invoked
  - Verify: Textract called
  - Verify: Data extracted correctly
  - Acceptance: OCR works

- [ ] **Commit OCR Lambda**
  - Message: "Add OCR processing Lambda"

### 4.4 Transaction Matching Lambda

- [ ] **Create Lambda directory**
  - Create: `packages/aws/amplify/functions/match-receipt-transaction/`
  - Acceptance: Directory exists

- [ ] **Create Lambda resource**
  - File: `resource.ts`
  - Trigger: DynamoDB stream (Receipt table, ocrStatus=completed)
  - Acceptance: Function defined

- [ ] **Implement handler**
  - File: `handler.ts`
  - Logic:
    1. Receive Receipt with extracted data
    2. Find transactions matching:
       - Date within ±3 days
       - Amount within ±5%
       - Merchant name fuzzy match
    3. Store suggested matches with confidence scores
    4. Update matchStatus to suggested
    5. If high confidence (>90%), auto-confirm?
  - Use: Fuzzy string matching library
  - Acceptance: Handler compiles

- [ ] **Add to backend**
  - Configure DynamoDB stream trigger
  - Acceptance: Lambda connected

- [ ] **Test matching Lambda**
  - Create test receipt
  - Create matching transaction
  - Verify: Match found
  - Verify: Confidence score reasonable
  - Acceptance: Matching works

- [ ] **Commit matching Lambda**
  - Message: "Add receipt-transaction matching"

### 4.5 Receipt Camera UI

- [ ] **Install camera library**
  - Install: expo-camera or react-native-camera
  - Configure: Permissions in app.json
  - Acceptance: Library installed

- [ ] **Create camera screen**
  - File: `apps/native/app/(protected)/receipts/camera.tsx`
  - Show: Camera view (full screen)
  - Button: Capture photo
  - Show: Preview after capture
  - Buttons: Retake or Upload
  - Upload: Call ReceiptService.uploadReceipt()
  - Show: Upload progress indicator
  - Navigate: To receipt list after upload
  - Acceptance: Camera works

- [ ] **Add camera button**
  - Location: Receipts tab or floating action button
  - Icon: Camera icon
  - Acceptance: Can access camera

- [ ] **Test camera flow**
  - Open camera
  - Take photo
  - Preview
  - Upload
  - Verify: Receipt appears in list
  - Acceptance: Full flow works

- [ ] **Commit camera UI**
  - Message: "Add receipt camera screen"

### 4.6 Receipt List & Detail UI

- [ ] **Create receipt list screen**
  - File: `apps/native/app/(protected)/receipts/index.tsx`
  - Show: Grid or list of receipts
  - Each receipt:
    - Thumbnail image
    - Merchant name (if OCR done)
    - Date and amount
    - OCR status indicator (processing/done)
    - Match status indicator (unmatched/matched)
  - Filters: All, Unmatched, Matched, Processing
  - Button: Add Receipt (camera)
  - Acceptance: List renders receipts

- [ ] **Create receipt detail screen**
  - File: `apps/native/app/(protected)/receipts/[receiptId].tsx`
  - Show: Receipt image (zoomable, pinch to zoom)
  - Show: Extracted data:
    - Merchant, Date, Total
    - Line items list
  - Show: Transaction matches (if any)
    - List suggested transactions
    - Button: Confirm match
    - Button: Reject match
  - Button: Edit line items (manual correction)
  - Button: Delete receipt
  - Acceptance: Detail view works

- [ ] **Implement match confirmation**
  - Tap: Confirm match button
  - Call: ReceiptService.matchReceiptToTransaction()
  - Update: Receipt matchStatus
  - Update: Transaction with receipt link
  - Acceptance: Can confirm matches

- [ ] **Add to navigation**
  - Add: "Receipts" tab or section
  - Acceptance: Can navigate to receipts

- [ ] **Commit receipt screens**
  - Message: "Add receipt screens"

### 4.7 Line-Item Categorization

- [ ] **Extend Transaction model**
  - Add field: `lineItems?: Array<ReceiptLineItem>`
  - Type: `{ description: string, category: string, amount: number }`
  - Update: Amplify schema
  - Acceptance: Model supports line items

- [ ] **Create categorization UI**
  - Component: LineItemCategorizer
  - For each line item:
    - Show description and amount
    - Category picker (with suggestions)
    - Save button
  - Acceptance: Can categorize line items

- [ ] **Implement category suggestions**
  - Simple: Rule-based (e.g., "milk" → "Groceries")
  - Advanced: ML model (future)
  - Acceptance: Suggestions appear

- [ ] **Update spending analytics**
  - If transaction has line items:
    - Use line-item categories instead of transaction category
    - More accurate spending breakdowns
  - Acceptance: Analytics use line items

- [ ] **Commit line-item categorization**
  - Message: "Add line-item categorization"

### 4.8 Bill Scanning (Similar to Receipts)

- [ ] **Create Bill model**
  - Similar to Receipt model
  - Additional fields: dueDate, billType, recurring
  - Acceptance: Model defined

- [ ] **Reuse camera UI**
  - Add: "Scan Bill" option in camera screen
  - Same flow as receipts
  - Acceptance: Can scan bills

- [ ] **Create bill-specific OCR**
  - Extract: Amount, Due Date, Merchant
  - Create: Reminder for due date
  - Optional: Recurring detection
  - Acceptance: Bill OCR works

- [ ] **Create bill list screen**
  - Show: Upcoming bills
  - Show: Overdue bills (red)
  - Show: Paid bills
  - Acceptance: Bill list works

- [ ] **Commit bill scanning**
  - Message: "Add bill scanning feature"

- [ ] **Mark Phase 4 complete**
  - Update progress
  - Document completion date

---

## 📋 Phase 5: Polish & Launch (Week 8+)

**Goal:** Testing, monitoring, performance, security, deployment

**Why:** Ship a high-quality product, ensure reliability

**Success Criteria:**
- ✅ All critical bugs fixed
- ✅ Performance is smooth on real devices
- ✅ Security audit passed
- ✅ Monitoring and alerting configured
- ✅ Beta users can sign up and use app

### 5.1 Performance Optimization

- [ ] **Profile Lambda cold starts**
  - Measure: Cold start times for all Lambdas
  - Optimize: Reduce bundle sizes
  - Consider: Provisioned concurrency if needed
  - Acceptance: Cold starts <2 seconds

- [ ] **Optimize database queries**
  - Add: Indexes for common queries
  - Review: Query patterns in CloudWatch
  - Fix: Slow queries (>1 second)
  - Acceptance: P95 query time <500ms

- [ ] **Implement caching**
  - Where: Frequently accessed data (budgets, categories)
  - How: In-memory cache or ElastiCache
  - TTL: Appropriate for each data type
  - Acceptance: Reduced database calls

- [ ] **Optimize native app**
  - Lazy load: Images and large lists
  - Virtualize: Long lists (FlatList optimization)
  - Memoize: Expensive computations
  - Acceptance: Smooth scrolling on older devices

- [ ] **Test with large datasets**
  - Create: Test data (1000+ transactions)
  - Test: App performance
  - Fix: Any slowness
  - Acceptance: Handles large data well

- [ ] **Commit optimizations**
  - Message: "Performance optimizations"

### 5.2 Error Handling & Recovery

- [ ] **Add error boundaries**
  - Native app: Global error boundary
  - Catch: Render errors
  - Show: Friendly error message
  - Log: Errors to service (Sentry?)
  - Acceptance: App doesn't crash

- [ ] **Implement retry logic**
  - Sync: Retry failed syncs (exponential backoff)
  - API calls: Retry on transient errors
  - Acceptance: Handles temporary failures

- [ ] **Improve error messages**
  - User-friendly: No technical jargon
  - Actionable: Tell user what to do
  - Examples:
    - "We couldn't sync your transactions. Check your internet connection."
    - "This account is disconnected. Reconnect in Settings."
  - Acceptance: Clear error messages

- [ ] **Add offline mode support**
  - Cache: Some data locally (AsyncStorage)
  - Queue: Actions when offline
  - Sync: When back online
  - Acceptance: Basic offline functionality

- [ ] **Commit error handling**
  - Message: "Improve error handling"

### 5.3 Security Hardening

- [ ] **Security audit of IAM permissions**
  - Review: All Lambda permissions
  - Principle: Least privilege
  - Remove: Unused permissions
  - Acceptance: Minimal permissions

- [ ] **Input validation**
  - All Lambdas: Validate input
  - Prevent: Injection attacks
  - Sanitize: User input
  - Acceptance: No unvalidated input

- [ ] **SQL injection prevention**
  - Use: Parameterized queries (if using SQL)
  - For DynamoDB: Use SDK methods (safe by default)
  - Acceptance: No SQL injection risk

- [ ] **XSS prevention in comments**
  - Sanitize: Comment text
  - Escape: HTML entities
  - No: User-provided HTML
  - Acceptance: Comments safe

- [ ] **Rate limiting**
  - API Gateway: Configure rate limits
  - Per user: Reasonable limits (e.g., 100 req/min)
  - Acceptance: Protected from abuse

- [ ] **Secrets management**
  - Verify: Credentials in Parameter Store
  - Verify: Encryption enabled
  - Verify: No secrets in code
  - Acceptance: Secrets secure

- [ ] **Commit security improvements**
  - Message: "Security hardening"

### 5.4 Testing

- [ ] **Write unit tests for critical services**
  - AccountService
  - BudgetService
  - FeedService
  - ReceiptService
  - Coverage: >70%
  - Acceptance: Tests pass

- [ ] **Write integration tests for sync flow**
  - Test: End-to-end sync (YNAB → DynamoDB)
  - Test: Feed generation
  - Test: Receipt OCR and matching
  - Acceptance: Integration tests pass

- [ ] **E2E tests for core user flows**
  - Flow: Sign up → Connect account → View transactions
  - Flow: Create budget → Track spending
  - Flow: Upload receipt → Match transaction
  - Tool: Detox or Appium
  - Acceptance: E2E tests pass

- [ ] **Load testing for Lambdas**
  - Simulate: 100 concurrent syncs
  - Measure: Response times, errors
  - Verify: Auto-scaling works
  - Acceptance: Handles load

- [ ] **Commit tests**
  - Message: "Add comprehensive tests"

### 5.5 Documentation

- [ ] **Update ARCHITECTURE.md**
  - Document: All systems built
  - Include: Diagrams (sequence, architecture)
  - Explain: Design decisions
  - Acceptance: Comprehensive technical docs

- [ ] **Create DEPLOYMENT.md**
  - Document: Deployment process
  - Include: Environment setup
  - Include: Rollback procedures
  - Acceptance: Can deploy from docs

- [ ] **API documentation**
  - For: External developers (future)
  - Document: REST API endpoints
  - Format: OpenAPI/Swagger
  - Acceptance: API documented

- [ ] **User guide / help docs**
  - How to: Connect accounts
  - How to: Create budgets
  - How to: Scan receipts
  - Troubleshooting: Common issues
  - Acceptance: Users can self-help

- [ ] **Commit documentation**
  - Message: "Complete documentation"

### 5.6 Monitoring & Alerts

- [ ] **Create CloudWatch dashboard**
  - Metrics:
    - Sync success/failure rates
    - Lambda invocation counts
    - Error rates by provider (YNAB, Plaid)
    - Average sync duration
    - API response times
  - Graphs: 24 hours, 7 days, 30 days views
  - Acceptance: Dashboard shows key metrics

- [ ] **Set up SNS alerts**
  - Alert: High error rate (>10% failures)
  - Alert: Lambda timeouts
  - Alert: DynamoDB throttling
  - Alert: Budget exceeded (cost alert)
  - Send to: Email or Slack
  - Acceptance: Alerts configured

- [ ] **Add error tracking**
  - Tool: Sentry or similar
  - Track: Native app crashes
  - Track: Lambda errors
  - Acceptance: Error tracking works

- [ ] **Document monitoring**
  - How to: View logs
  - How to: Check metrics
  - How to: Respond to alerts
  - Acceptance: Monitoring documented

- [ ] **Commit monitoring setup**
  - Message: "Production monitoring setup"

### 5.7 Beta Launch Preparation

- [ ] **Create landing page**
  - Domain: nueink.com
  - Content: Product description, screenshots
  - CTA: "Join Beta" button
  - Form: Email signup (store in DynamoDB)
  - Acceptance: Landing page live

- [ ] **Set up beta access**
  - Limit: First 50-100 users
  - Process: Approve signups manually
  - Invite: Send credentials via email
  - Acceptance: Beta program ready

- [ ] **Prepare beta feedback form**
  - In-app: Feedback button
  - Questions: What do you like? What's confusing? What's missing?
  - Store: Responses in DynamoDB
  - Acceptance: Can collect feedback

- [ ] **Create onboarding flow**
  - Screen 1: Welcome to NueInk
  - Screen 2: Connect your first account
  - Screen 3: Tour of features
  - Screen 4: Invite family member (optional)
  - Acceptance: Smooth onboarding

- [ ] **Deploy to production**
  - Run: Production deployment
  - Verify: All systems operational
  - Verify: Can sign up and use app
  - Acceptance: Production ready

- [ ] **Invite beta users**
  - Send: Email invites to waitlist
  - Batch: 10-20 users per day
  - Monitor: For issues
  - Acceptance: Beta users active

- [ ] **Mark Phase 5 complete**
  - Update progress
  - Document launch date
  - Celebrate! 🎉

---

## 🔮 Phase 6: Future Enhancements (Post-MVP)

**Goal:** Advanced features based on user feedback and market demand

### 6.1 AI & Machine Learning

- [ ] **AI Budget Suggestions**
  - Collect 3+ months of spending data
  - Train model or use heuristics
  - Suggest budget amounts by category
  - User reviews and adjusts
  - Reference: [SIMPLIFIED_MVP_PLAN.md](./SIMPLIFIED_MVP_PLAN.md) - Phase 2

- [ ] **Anomaly Detection**
  - Flag unusual transactions (large amounts, new merchants)
  - Detect duplicates
  - Alert for potential fraud
  - ML model or rule-based

- [ ] **Smart Categorization**
  - Auto-categorize transactions with ML
  - Learn from user corrections
  - Support line-item categorization

### 6.2 Additional Integrations

- [ ] **Plaid Integration (Full Implementation)**
  - Complete PlaidIntegration class
  - Add Plaid Link UI flow (OAuth)
  - Handle Plaid webhooks for real-time updates
  - Support all US banks

- [ ] **Credit Karma / Credit Score**
  - Show credit score in dashboard
  - Track changes over time
  - Link to credit report

- [ ] **Investment Accounts**
  - Support brokerage accounts (Plaid Investments)
  - Show portfolio performance
  - Net worth tracking

### 6.3 Advanced Features

- [ ] **Goals & Milestones**
  - Create savings goals (target amount, deadline)
  - Create debt payoff goals (use existing Debt model)
  - Track progress with progress bars
  - Generate FeedItems for milestones reached

- [ ] **Manual Account Entry**
  - UI to add manual accounts (cash, assets)
  - UI to add manual transactions
  - Implement ManualIntegration (no external API)

- [ ] **Shared Goals (Family)**
  - Family vacation fund
  - College savings
  - Multiple people contribute
  - Track individual contributions

- [ ] **Bill Pay Integration**
  - Research: Bill pay APIs
  - Option 1: Partner with bill pay service
  - Option 2: Use bank bill pay (limited)
  - Reference: [BILL_PAY_INTEGRATION.md](./BILL_PAY_INTEGRATION.md)

### 6.4 Export & Reporting

- [ ] **Export Transactions**
  - Format: CSV or Excel
  - Filters: Date range, categories, accounts
  - Download or email

- [ ] **Generate PDF Reports**
  - Monthly spending report
  - Yearly tax summary
  - Budget performance report

- [ ] **Tax Report Generation**
  - Categorize transactions as tax-deductible
  - Group by category
  - Export for accountant

### 6.5 External REST API

- [ ] **Design Public API**
  - Endpoints: Transactions, Budgets, Accounts (read-only)
  - Authentication: API keys
  - Rate limiting: Per API key
  - Documentation: OpenAPI/Swagger

- [ ] **Implement API Gateway**
  - New API Gateway stack
  - Separate from internal API
  - Versioning: /v1/

- [ ] **API Documentation Site**
  - Docs: API reference
  - Examples: Code snippets
  - Playground: Try API calls

### 6.6 Web Application

- [ ] **Build Web App**
  - Technology: React + React Native Web (reuse components)
  - URL: app.nueink.com
  - Full feature parity with mobile

- [ ] **Responsive Design**
  - Mobile, tablet, desktop layouts
  - Adapt charts and lists for large screens

### 6.7 Collaborative Features

- [ ] **Family Roles & Permissions**
  - Role: Parent (full access)
  - Role: Child (view only, request spending)
  - Role: Viewer (read-only)

- [ ] **Spending Requests**
  - Child: "Can I buy X for $Y?"
  - Parent: Approve or deny
  - Feed: Shows request and decision

- [ ] **Shared Budgets**
  - Assign: Multiple people to one budget
  - Track: Who spent what in shared budget

---

## 📚 Context for Future Claude Sessions

### Quick Start for New Sessions

**If you're Claude in a new session, start here:**

1. **Read this file first** - Contains everything about the project
2. **Read [SIMPLIFIED_MVP_PLAN.md](./SIMPLIFIED_MVP_PLAN.md)** - 8-week MVP strategy
3. **Read [NUEINK_ASSESSMENT.md](./NUEINK_ASSESSMENT.md)** - Complete vision and reusability analysis
4. **Check "Current Sprint" section** - See what's being worked on now
5. **Ask the user** - "What phase are you on?" or "What's next?"

---

## 🅿️ Parked Ideas

**Purpose:** Capture all brainstormed features regardless of current fit. As the product evolves, some of these may become relevant and move into active phases.

**Instructions:** Never delete ideas from this section. Add new ideas with date and source. Mark with priority when reviewed.

---

### Gamification & Engagement (November 11, 2025)

**Source:** Brainstorming session with wife

**Concept:** Full gamification system with points, levels, bonuses, and avatars

**Features:**
- **Points & Levels System**
  - Accumulate points for financial behaviors (saving, budgeting, checking in)
  - Level up with increasing rewards
  - Weekly competition resets
  - Winner gets financial bonuses (e.g., $100 to partner who saves most)

- **Avatar & In-App Rewards**
  - Build custom avatar
  - Earn credits through financial wisdom (not purchases)
  - Unlock cosmetics/features with credits
  - Tied to real financial performance

- **Partner Competition**
  - Compete between partners/family members
  - Weekly/monthly leaderboards
  - Prize pools from family budget
  - Team mode vs individual goals

**Why Parked:**
- Major scope expansion (entire product)
- Risk of feeling gimmicky if not executed perfectly
- Requires significant design/UX work
- Core finance features must work first

**Potential Fit:**
- Phase 4-5 as engagement layer
- Could be separate premium tier ($9.99/month)
- Post-MVP after validating core social features work

**Technical Notes:**
- Would need: Points engine, leveling system, avatar system, reward shop
- Integration points: Comments, transactions, budgets, check-ins
- Metrics: Engagement time, retention, viral coefficient

---

### Chores Integration (November 11, 2025)

**Source:** Brainstorming session with wife, inspired by Nipto app

**Concept:** Tie household chores to financial system for kids

**Features:**
- **Chore Tracking**
  - Assign chores to family members
  - Track completion throughout week
  - Points for completed chores
  - Weekly winners get rewards

- **Financial Rewards**
  - Chore points → allowance money
  - Bonus points for quality/speed
  - Consequences for missed chores (reduced allowance)
  - Parent approval workflow

- **Competition Modes**
  - Individual goals (personal improvement)
  - Family competition (leaderboard)
  - Team challenges (siblings work together)

**Why Parked:**
- **Not a finance app** - this is family management
- Competes with established chore apps (Nipto, OurHome, etc.)
- Scope creep from core mission
- Different user personas (parents managing kids vs partners managing finances)

**Potential Fit:**
- Separate product: "NueInk Family" spin-off
- Far future: Family tier with chore module
- Partnership with existing chore app?

**Technical Notes:**
- Would need: Chore data model, assignment system, completion tracking, approval workflow
- Similar patterns to savings goals but different domain

---

### Academic Performance Tracking (November 11, 2025)

**Source:** Brainstorming session with wife

**Concept:** Tie financial bonuses to academic performance

**Features:**
- **GPA Tracking**
  - Manual or automated grade imports
  - Historical GPA trends
  - Compare to goals

- **Scholarship Bonuses**
  - Parents set GPA thresholds
  - Auto-bonuses when threshold met
  - Track scholarship earnings over time
  - Motivation for college savings

- **Grade-Based Allowance**
  - Allowance increases/decreases with grades
  - Bonus for improvement (not just absolute GPA)
  - A's = bonus, D's/F's = consequence

**Why Parked:**
- **Not a finance app** - this is education tracking
- Privacy concerns (grade data is sensitive)
- Integration challenges (schools have different systems)
- Competes with established education apps

**Potential Fit:**
- **Never** - too far from core mission
- Alternative: Simple "goal" system where GPA is manual input, bonus is manual reward

**Technical Notes:**
- Would need: Grade import, GPA calculation, threshold triggers, bonus automation

---

### Widget Check-In & Engagement Tracking (November 11, 2025)

**Source:** Brainstorming session with wife

**Concept:** Gamify daily financial awareness through widget interactions

**Features:**
- **Daily Check-In Tracking**
  - Widget detects when user views it (via app open or biometric check)
  - Streak tracking (7 days, 30 days, etc.)
  - Rewards for consistency

- **Comprehension Quizzes**
  - After viewing widget, quick quiz to confirm awareness
  - "Where is your budget at?" (multiple choice)
  - "Did you overspend yesterday?" (yes/no)
  - Points/badges for correct answers

- **Pre-Purchase Check-In**
  - User about to spend $20 on candy/energy drinks
  - Opens widget to check budget first
  - Gets bonus for checking before spending
  - Nudges toward better decisions

**Why Parked:**
- Requires gamification infrastructure first
- Widget biometric detection is platform-limited
- Check-in tracking needs backend + metrics system
- Deferred until widget proves valuable

**Potential Fit:**
- Phase 3-4 after basic widget launched
- Could increase engagement significantly
- Ties into gamification system if built

**Technical Notes:**
- iOS/Android widget limitations on interaction detection
- May need app-based check-in rather than pure widget
- Backend: Check-in events, streak calculation, reward system

---

### Smart Home Integration (November 11, 2025)

**Source:** Brainstorming session with wife

**Concept:** Voice-based financial queries via Alexa/Google Home

**Features:**
- **Voice Queries**
  - "Alexa, what's my account balance?"
  - "Hey Google, did I stay on budget this week?"
  - "Alexa, how much did I spend at restaurants?"

- **Voice Notifications**
  - "You've used 80% of your dining budget"
  - "New transaction: $45.67 at Whole Foods"
  - "Your partner commented on a transaction"

**Why Parked:**
- Not core to mission (nice-to-have)
- Privacy/security concerns (voice in home)
- Partnership/certification required (Amazon, Google)
- Low priority vs other features

**Potential Fit:**
- Phase 5+ as polish feature
- Partnership opportunity post-launch
- Marketing angle: "Only finance app on Alexa"

**Technical Notes:**
- Alexa Skills Kit / Google Actions
- OAuth flow for account linking
- Privacy: What data is safe to voice-expose?

---

### Receipt Email Auto-Processing (November 11, 2025)

**Source:** Brainstorming session with wife (Walmart receipt example)

**Concept:** Auto-import receipts from email for reconciliation

**Features:**
- **Email Integration**
  - User registers NueInk email with merchants (Walmart, Target, etc.)
  - Receipts emailed to unique NueInk address
  - NueInk parses email, extracts receipt
  - Auto-matches to transaction

- **Receipt Reconciliation**
  - Compare receipt items to transaction amount
  - Flag discrepancies
  - Attach receipt image/PDF to transaction
  - Search receipts by item

**Why Parked:**
- **Actually fits well** - but Phase 4 feature
- Overlaps with receipt scanning (already planned Phase 4)
- Email integration adds complexity
- Merchant-specific parsing required

**Potential Fit:**
- **Phase 4** - alongside receipt scanning
- Alternative to camera-based scanning
- Both methods should be supported

**Technical Notes:**
- Unique email per user: receipts+userid@nueink.com
- SES inbound email → Lambda → parse HTML/PDF
- Receipt parsers per merchant (Walmart, Amazon, Target formats)
- Storage: S3 for PDFs, DynamoDB for metadata

---

### Offline Widget with Biometric Privacy (November 11, 2025)

**Source:** Brainstorming session with wife

**Concept:** Widget works offline and requires biometric check to view numbers

**Features:**
- **Offline Mode**
  - Widget shows last sync data even without internet
  - Displays: "Last updated: 2 hours ago" warning
  - Useful in mountains/airplane/poor reception

- **Biometric Privacy**
  - Widget shows "***" by default
  - Tap widget → biometric prompt (Face ID / Touch ID)
  - After unlock: Shows actual numbers
  - Re-locks after timeout

**Why Parked:**
- **Partially implemented in Phase 1.9** (offline works, biometrics don't)
- Platform limitation: Widgets can't trigger biometric prompts
- Workaround: Tap widget → opens app → biometric → shows dashboard

**Potential Fit:**
- Phase 1.9 delivers offline widget ✅
- Biometric unlock happens in-app (not widget)
- Privacy mode: Setting to hide numbers in widget ✅

**Technical Notes:**
- iOS/Android widgets cannot trigger biometric prompts (security limitation)
- Best we can do: Blur/hide numbers when phone locked, tap to open app
- In-app: Biometric gate before showing dashboard

---

### Parent-Child Advanced Features (November 11, 2025)

**Source:** Brainstorming session with wife

**Status:** ⚠️ **PARTIALLY IN ROADMAP** - See Phase 2.5 for core features

**Implemented in Phase 2.5:**
- ✅ Parent/child roles in Membership model
- ✅ Savings goals with parent match percentage
- ✅ Auto-allocation of parent contributions
- ✅ Booster comments (financial kudos)
- ✅ History tracking for privilege awareness

**Still Parked (Future Consideration):**
- Daily financial awareness requirements for kids
- Consequences system for not checking in
- Birthday/holiday money bonuses (auto-tracking)
- Financial education modules
- Age-appropriate financial literacy content

**Why Partially Parked:**
- Core features fit well (Phase 2.5)
- Education/consequence features are scope creep
- Need to validate basic parent-child interaction first

**Potential Fit:**
- Core features: Phase 2.5 ✅
- Education modules: Phase 5+ or separate product
- Advanced consequences: Post-MVP based on feedback

---

### Review Schedule

**Quarterly Review:** Last Sunday of each quarter
- Review all parked ideas
- Evaluate fit based on current product state
- Move relevant ideas to active phases
- Archive ideas that no longer make sense

**Next Review:** March 31, 2026

---

### Key Architectural Decisions Made

**Clean Architecture (November 11, 2025):**
- `@nueink/core` = React Native safe (domain, services, repository interfaces)
- `@nueink/aws` = Lambda only (infrastructure, repository implementations, EventBridge)
- Repository interfaces use generics (no AWS dependencies)
- Services return domain models, not entities
- Converters bridge domain ↔ entities (can import from aws)

**Financial Sync Architecture (November 11, 2025):**
- EventBridge scheduler (not SQS) for event distribution
- AppSync subscriptions for real-time updates (not custom WebSocket management)
- CloudWatch EMF (not PutMetricData) for free metrics
- No DLQ - next scheduled sync handles failures
- 15-minute sync interval (configurable per provider)
- Direct to Transaction table (cache tables added later if needed)

**Social Feed Architecture (November 11, 2025):**
- Dedicated FeedItem table (not client-side aggregation)
- DynamoDB Streams → Feed Generation Lambda → FeedItem records
- Single AppSync subscription per client (FeedItem.onCreate/onUpdate)
- Server-side aggregation and feed generation
- Feed-specific metadata (isRead, reactions, commentCount)

**Real-Time Strategy:**
- AppSync built-in subscriptions (free tier: 1M connection-min/month)
- No custom WebSocket infrastructure needed
- Automatic reconnection, offline queueing, authentication
- All CRUD events: onCreate, onUpdate, onDelete

**Data Decisions:**
- All amounts in cents (integers, not dollars)
- Granular account types (checking, savings, credit_card) not abstract (depository, credit)
- GraphQL via repositories (not REST API)

**Technology Stack:**
- AWS Amplify Gen 2 (backend)
- React Native + Expo (mobile)
- TypeScript (throughout)
- Monorepo with Yarn workspaces

### User Preferences & Patterns

**Development Philosophy:**
- **Simple > Complex** - "If it's hard, people won't do it"
- **Zero friction** - Only features requiring minimal user effort
- **Auto-everything** - Auto-assign, auto-categorize, auto-update
- **Social-first** - Make finance engaging, not boring
- **Solo-friendly** - Build as solo founder, hire strategically later

**Decision-Making Style:**
- Research-driven (extensive analysis before building)
- User-focused (test with real users, iterate based on feedback)
- Pragmatic (cut features that add friction)
- Iterative (MVP first, then enhance)

**Technical Preferences:**
- Modern stack (Amplify Gen 2, Expo, TypeScript)
- Scalable (serverless, infrastructure as code)
- Reusable (monorepo, shared packages)
- Type-safe (TypeScript throughout)

### Important Links

**Strategic Documentation:**
- [NUEINK_ASSESSMENT.md](./NUEINK_ASSESSMENT.md) - Complete vision, 80% reusability assessment
- [MARKET_DISRUPTION_ANALYSIS.md](./MARKET_DISRUPTION_ANALYSIS.md) - 9/10 disruption potential
- [SIMPLIFIED_MVP_PLAN.md](./SIMPLIFIED_MVP_PLAN.md) - 8-week roadmap
- [SOLO_FOUNDER_FEASIBILITY.md](./SOLO_FOUNDER_FEASIBILITY.md) - Solo founder success analysis

**Feature Analysis:**
- [SOCIAL_FEED_ANALYSIS.md](./SOCIAL_FEED_ANALYSIS.md) - Deep dive on feed features
- [AUTO_PERSON_ASSIGNMENT.md](./AUTO_PERSON_ASSIGNMENT.md) - Person assignment technical feasibility
- [BILL_SCANNING_FEATURE.md](./BILL_SCANNING_FEATURE.md) - Bill scanning implementation
- [BILL_PAY_INTEGRATION.md](./BILL_PAY_INTEGRATION.md) - Bill payment strategies

**Business/Market:**
- [MARKET_ANALYSIS.md](./MARKET_ANALYSIS.md) - Target audience, pricing
- [AWS_COST_ESTIMATE.md](./AWS_COST_ESTIMATE.md) - Detailed cost projections
- [DIRECT_INTEGRATION_ANALYSIS.md](./DIRECT_INTEGRATION_ANALYSIS.md) - YNAB vs Plaid comparison
- [MULTI_INTEGRATION_STRATEGY.md](./MULTI_INTEGRATION_STRATEGY.md) - Multi-source architecture

**Marketing:**
- [SOCIAL_MEDIA_STRATEGY.md](./SOCIAL_MEDIA_STRATEGY.md) - Build-in-public strategy
- [BUILD_IN_PUBLIC_RISKS.md](./BUILD_IN_PUBLIC_RISKS.md) - Risk analysis

**Technical:**
- [CLAUDE.md](../CLAUDE.md) - Instructions for Claude Code
- [ONBOARDING-NOTES.md](../ONBOARDING-NOTES.md) - Current development status

### Common Questions & Answers

**Q: What's unique about NueInk?**
A: Social feed, comments on transactions, person auto-assignment, receipt/bill scanning. NO competitor has these features.

**Q: Why the pivot from health to finance?**
A: 80% of existing infrastructure is reusable. Finance has bigger market opportunity (20M Mint refugees).

**Q: How long to MVP?**
A: 6-8 weeks following the simplified plan.

**Q: What's the business model?**
A: $6.99/month (half the price of competitors). Profit margins >90% at scale.

**Q: When to build in public?**
A: START NOW. Don't wait for finished product. Build audience while building.

---

## 📝 Maintenance Notes

**This file should be updated:**
- **Daily:** When starting new tasks or completing tasks
- **Weekly:** Review and update progress percentages
- **Per phase:** When completing a phase, update status and dates
- **As needed:** When discovering new tasks or changing priorities

**Commit message format:**
```
Update TASKS.md: [what changed]

- Completed: [task names]
- Added: [new tasks]
- Updated: [phase status]
```

**Keep this file as single source of truth for all NueInk development.**

---

*Last updated: November 11, 2025 by James Flesher*
