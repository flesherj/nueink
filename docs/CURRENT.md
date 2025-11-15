# NueInk - Current Sprint & Tasks

**Last Updated:** November 14, 2025
**Current Phase:** Phase 1 - Financial Data Integration
**Sprint:** Week 1 (Nov 11-17, 2025)

---

## 🚀 Current Sprint (Week 1: Nov 11-17, 2025)

### Completed Nov 14 ✅

- [x] **OAuth Integration Complete** (Nov 14 - DONE)
  - ✅ YNAB OAuth callback handler implemented
  - ✅ OAuth tokens stored in Secrets Manager
  - ✅ IntegrationConnected event published to EventBridge
  - ✅ Mobile app OAuth flow working end-to-end

- [x] **Financial Sync Infrastructure** (Nov 14 - DONE)
  - ✅ EventBridge rules configured (schedule + event-driven)
  - ✅ Financial sync Lambda triggered on integration connect
  - ✅ Account sync working (19 YNAB accounts synced)
  - ✅ Transaction sync working (transactions stored in DynamoDB)
  - ✅ AWSJSON type fixes (rawData field properly stringified)
  - ✅ EventBridge rule naming fixed (explicit ruleName properties)
  - ✅ Event bus naming fixed (sandbox ID resolution)

- [x] **Build System Improvements** (Nov 14 - DONE)
  - ✅ Added presandbox:dev script to clean stale JS files
  - ✅ Fixed EventBridge rule naming (64-char limit)
  - ✅ Sandbox utilities moved to shared folder

### Completed Nov 11 ✅

- [x] **Phase 0 - Complete architectural refactoring** (Nov 11 - DONE)
  - ✅ Repository pattern with generics (all 10 services)
  - ✅ Clean architecture separation (core vs aws)
  - ✅ TypeScript compilation fixed (all packages)
  - ✅ REST API infrastructure removed (AppSync only)
  - ✅ Event architecture with dependency injection
  - ✅ Monorepo build scripts for Yarn Classic
  - ✅ Budget.endDate made optional
  - ✅ Amplify env type declarations

- [x] **Create TASKS.md master file** (Nov 11 - DONE)
  - Single source of truth for all work
  - Phase 1.9 and Parked Ideas added
  - Comprehensive task tracking

### Up Next ⏭️

1. **Mobile UI for Accounts** - Display synced financial accounts in app
2. **Transaction Feed UI** - Show transactions in social feed format
3. **Pull-to-Refresh** - Add manual sync trigger from mobile app
4. **Real-time Sync Notifications** - AWS IoT Core for sync status updates

---

## 🎯 Critical Path to MVP (What's Actually Needed Next)

**Focus:** Get data flowing → Show in UI → Ship MVP

**Not Needed Yet:**
- ❌ Advanced budgeting
- ❌ Receipt scanning
- ❌ Bill scanning
- ❌ Person auto-assignment (can do basic manual assignment)
- ❌ Analytics dashboard
- ❌ Complex filtering

**Core MVP Features:**
1. ✅ Connect YNAB/Plaid (OAuth)
2. ✅ Sync accounts and transactions
3. ⏭️ Display accounts in UI
4. ⏭️ Display transactions in feed
5. ⏭️ Basic comments on transactions
6. ⏭️ Manual person assignment

### Step 1: Configure Amplify Secrets ✅ COMPLETE

**Goal:** Store provider credentials securely in AWS

- [x] **Set YNAB secrets** ✅
  - File: N/A (CLI command)
  - Command: `npx ampx sandbox secret set YNAB_CLIENT_ID`
  - Command: `npx ampx sandbox secret set YNAB_CLIENT_SECRET`
  - Acceptance: Secrets available to Lambdas via `env.YNAB_CLIENT_ID` ✅

- [x] **Update SSM parameter for redirect URI** ✅
  - Parameter: `/amplify/nueinkaws/dev/YNAB_REDIRECT_URI`
  - Value: Current OAuth API Gateway URL (changes per deployment)
  - Tool: AWS Console or CLI
  - Acceptance: OAuth callback URL matches deployed API ✅

- [x] **Test secrets access** ✅
  - Test: Console.log in Lambda to verify secrets loaded
  - Acceptance: Secrets available at runtime ✅

### Step 2: Build OAuth Initiation Flow ✅ COMPLETE

**Goal:** User clicks "Connect YNAB" → redirects to provider → returns to app

- [x] **Create Connect Accounts screen**
  - File: `apps/native/app/(protected)/settings/connect-accounts.tsx` ✅
  - UI: List of providers (YNAB, Plaid) with "Connect" buttons ✅
  - Show: Connection status (connected/not connected) - Basic UI done
  - Acceptance: User can see available providers ✅

- [x] **Implement OAuth initiation**
  - File: Inline in connect-accounts.tsx (simple enough to not need service) ✅
  - Method: `connectProvider(provider)` with OAuth URL generation ✅
  - Build URL: `${providerAuthUrl}?client_id=...&redirect_uri=...&state=${accountId}:${provider}:${organizationId}` ✅
  - Action: Open browser to OAuth URL (expo-web-browser WebBrowser.openAuthSessionAsync) ✅
  - Acceptance: User redirected to provider login ✅

- [x] **Handle OAuth return**
  - File: `apps/native/app/oauth-success.tsx` (Expo Router handles deep link automatically) ✅
  - Parse: `nueink://oauth-success?provider=ynab` ✅
  - UI: Show success message with auto-redirect countdown ✅
  - Acceptance: User returns to app after OAuth ✅

- [x] **Configuration**
  - Added `.env.example` with YNAB_CLIENT_ID and OAUTH_REDIRECT_URI ✅
  - Updated `.gitignore` to exclude .env files ✅
  - Fixed backend handler deep link: `myapp://` → `nueink://` ✅

- [x] **Test OAuth flow end-to-end** ✅ COMPLETE
  - Setup: Copy `.env.example` to `.env` and add YNAB_CLIENT_ID ✅
  - Start: Click "Connect YNAB" ✅
  - OAuth: Login to YNAB, authorize ✅
  - Return: Back to app via nueink://oauth-success ✅
  - Verify: IntegrationConfig created in DynamoDB ✅
  - Verify: Tokens stored in Secrets Manager ✅
  - Acceptance: Complete OAuth flow works ✅
  - **Fixes applied:**
    - Updated YNAB_REDIRECT_URI in SSM to match current API Gateway URL
    - Added `secretsmanager:TagResource` permission to financial-connect Lambda IAM role

### Step 3: Display Synced Data ⏭️ NEXT

**Goal:** User sees their accounts and transactions in the app

- [ ] **Create Accounts list screen**
  - File: `apps/native/app/(protected)/accounts/index.tsx`
  - Query: `client.models.FinancialAccount.list({ filter: { organizationId: { eq: orgId } } })`
  - Display: Account name, mask, type, current balance
  - Group: By provider or institution
  - Acceptance: Synced accounts appear in UI

- [ ] **Create Account detail screen**
  - File: `apps/native/app/(protected)/accounts/[id].tsx`
  - Show: Account details, current balance, available balance
  - Show: Recent transactions for this account
  - Action: "Refresh balance" button (triggers sync)
  - Acceptance: Can view account details

- [ ] **Create Transactions feed**
  - File: `apps/native/app/(protected)/transactions/index.tsx`
  - Query: `client.models.Transaction.list({ filter: { organizationId: { eq: orgId } } })`
  - Sort: By date descending
  - Display: Date, merchant, amount, account
  - Pagination: Load more as user scrolls
  - Acceptance: Synced transactions appear in UI

- [ ] **Add pull-to-refresh**
  - Action: Trigger sync for user's integrations
  - UI: Show loading indicator
  - Update: Refresh data after sync completes
  - Acceptance: User can manually refresh data

- [ ] **Test data display end-to-end**
  - Setup: Complete OAuth for YNAB
  - Wait: For scheduled sync OR trigger manual sync
  - Verify: Accounts appear in accounts list
  - Verify: Transactions appear in feed
  - Verify: Balances are correct
  - Acceptance: Can see real financial data

### Step 4: End-to-End Validation

**Goal:** Verify the complete flow works for a real user

- [ ] **Test complete user journey**
  - Steps:
  1. New user signs up
  2. User navigates to Connect Accounts
  3. User clicks "Connect YNAB"
  4. User authorizes in YNAB
  5. User returns to app
  6. User sees transactions appear
  7. User can pull-to-refresh
  - Acceptance: Complete journey works

- [ ] **Test scheduled sync**
  - Wait: 4 hours OR manually invoke financial-sync Lambda
  - Verify: New transactions appear
  - Verify: Balances updated
  - Acceptance: Scheduled sync works

- [ ] **Test couples scenario**
  - Setup: Two users in same organization
  - Action: User A connects YNAB
  - Verify: User B sees same accounts/transactions
  - Verify: Both can comment on transactions
  - Acceptance: Multi-user sync works

---

## 📊 Progress Overview

### Overall Project Status

**Foundation:** ██████████ 100% (Existing infrastructure reusable)
**Phase 0 (Architecture):** ██████████ 100% ✅ (Completed Nov 11, 2025)
**Phase 1 (Integration):** ████░░░░░░ 40% (OAuth complete, account sync working)
**Phase 2 (Social Feed):** ░░░░░░░░░░ 0%
**Phase 3 (Intelligence):** ░░░░░░░░░░ 0%
**Phase 4 (Receipts/Bills):** ░░░░░░░░░░ 0%
**Phase 5 (Polish):** ░░░░░░░░░░ 0%

**Timeline to MVP:** 4-6 weeks remaining

### Key Milestones

- ✅ **Pivot Decision** (November 2025) - Committed to financial focus
- ✅ **Infrastructure Assessment** (100% reusable)
- ✅ **Strategic Planning** (15 comprehensive docs created)
- ✅ **YNAB Package** (Created integration foundation)
- ✅ **Architectural Refactoring** (Nov 11 - Phase 0 complete)
- ✅ **Phase 0 Complete** (Nov 11 - Clean architecture, TypeScript fixed)
- ✅ **Phase 1 Started** (Nov 11 - Data model review)
- ✅ **OAuth Integration Complete** (Nov 14 - YNAB OAuth working)
- ✅ **Financial Account Sync Working** (Nov 14 - 19 accounts synced)
- ✅ **Transaction Sync Working** (Nov 14 - Transactions syncing to DynamoDB)
- ⏭️ **Social Feed MVP** (Target: Week 4)
- ⏭️ **Beta Launch** (Target: Week 8)

---

*Last updated: November 14, 2025 by James Flesher*
