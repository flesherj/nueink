# Plaid Integration Implementation Plan

**Goal:** Enable users to connect bank accounts via Plaid and sync up to 24 months of historical transaction data for immediate Financial Discovery.

**Timeline:** ~5 days (1 week with buffer)

**Status:** Starting Nov 24, 2025

---

## Current State

### ✅ Already Implemented
- **Plaid Package Structure** (`packages/plaid/`)
  - `PlaidIntegration` - Client wrapper for Plaid API
  - `PlaidSyncProvider` - Implements FinancialSyncProvider interface
  - `PlaidOAuthService` - OAuth flow handling
  - `PlaidProviderFactory` - Factory for creating Plaid instances
- **Core Interfaces** (`packages/core/`)
  - `FinancialIntegration` - Standard integration interface
  - `FinancialSyncProvider` - Sync operations interface
  - `Transaction` - Domain model with date parsing utilities
  - `FinancialAccount` - Account domain model
- **Repository Layer** (`packages/aws/`)
  - Transaction and FinancialAccount repositories
  - Integration config management
  - Secret storage for access tokens

### ❌ Missing Components
1. **Plaid ↔ NueInk Converters**
   - PlaidAccountConverter (Plaid Account → FinancialAccount)
   - PlaidTransactionConverter (Plaid Transaction → Transaction)
2. **Backend Token Exchange**
   - Lambda endpoint to exchange public_token for access_token
   - Secure storage of Plaid access tokens
3. **Frontend Plaid Link**
   - React Native Plaid Link integration
   - Connect accounts UI flow
4. **Sync Lambda Integration**
   - Wire up Plaid sync in existing sync Lambda
   - Support both YNAB and Plaid providers

---

## Implementation Plan

### Phase 1: Converters (Day 1)
**Goal:** Convert Plaid data to NueInk domain models

#### Task 1.1: PlaidAccountConverter
- **File:** `packages/plaid/src/converters/PlaidAccountConverter.ts`
- **Input:** Plaid `AccountBase` type
- **Output:** NueInk `FinancialAccount`
- **Mapping:**
  - `account_id` → `financialAccountId`
  - `name` → `name`
  - `official_name` → `officialName`
  - `type` → `accountType` (checking, savings, credit, loan, etc.)
  - `subtype` → `accountSubtype`
  - `balances.current` → `currentBalance`
  - `balances.available` → `availableBalance`
  - `mask` → `mask` (last 4 digits)
  - Set `provider = 'plaid'`
  - Set `institutionName` from separate institution lookup

#### Task 1.2: PlaidTransactionConverter
- **File:** `packages/plaid/src/converters/PlaidTransactionConverter.ts`
- **Input:** Plaid `Transaction` type
- **Output:** NueInk `Transaction`
- **Mapping:**
  - `transaction_id` → `transactionId`
  - `account_id` → `financialAccountId`
  - `amount` → `amount` (convert to cents: amount * 100, flip sign)
  - `date` → `date` (use `parseTransactionDate` utility)
  - `authorized_date` → `authorizedDate`
  - `merchant_name` → `merchantName`
  - `name` → `name`
  - `pending` → `pending`
  - `category` → Store in `rawData`, will be categorized by AI later
  - Set `provider = 'plaid'`
  - Set `currency = 'USD'`
  - Set `status` based on `pending` flag

**Key Considerations:**
- Plaid amounts are positive for debits, negative for credits (opposite of YNAB)
- Need to flip sign: `amount = -plaidAmount * 100`
- Use shared `parseTransactionDate` utility for consistent date handling
- Store complete Plaid response in `rawData` for debugging

#### Task 1.3: Update PlaidIntegration
- Remove TODO comments
- Wire up converters in `getAccounts()` and `getTransactions()`
- Add institution name lookup and caching

**Files to Create:**
- `packages/plaid/src/converters/PlaidAccountConverter.ts`
- `packages/plaid/src/converters/PlaidTransactionConverter.ts`
- `packages/plaid/src/converters/index.ts`

**Acceptance Criteria:**
- ✅ Plaid accounts convert to FinancialAccount format
- ✅ Plaid transactions convert to Transaction format with proper dates
- ✅ All unit tests pass

---

### Phase 2: Backend Token Exchange (Day 2)
**Goal:** Securely exchange Plaid public_token for access_token and store it

#### Task 2.1: Plaid Configuration
- **File:** `packages/aws/amplify/backend.ts`
- Add Plaid secrets:
  - `PLAID_CLIENT_ID`
  - `PLAID_SECRET`
  - `PLAID_ENV` (sandbox, development, production)
- Add to Lambda environment variables

#### Task 2.2: Token Exchange Endpoint
- **File:** `packages/aws/amplify/functions/nueink-api/routers/PlaidRouter.ts`
- **Endpoint:** `POST /plaid/exchange-token`
- **Request Body:**
  ```json
  {
    "publicToken": "public-sandbox-xxx",
    "accountIds": ["account-1", "account-2"],
    "institutionId": "ins_xxx",
    "institutionName": "Chase"
  }
  ```
- **Flow:**
  1. Validate user authentication (Cognito)
  2. Call Plaid `/item/public_token/exchange`
  3. Receive `access_token` and `item_id`
  4. Store access_token in secrets manager:
     - Key: `plaid-access-token-{organizationId}-{itemId}`
     - Value: Encrypted access token
  5. Create IntegrationConfig record:
     - `provider = 'plaid'`
     - `accountId` = user's account
     - `organizationId` = user's organization
     - `status = 'active'`
     - Store `itemId` in metadata
  6. Create FinancialAccount records for each account
  7. Return success

#### Task 2.3: Create PlaidController
- **File:** `packages/aws/amplify/functions/nueink-api/controllers/PlaidController.ts`
- Implements token exchange logic
- Uses IntegrationConfigService to store config
- Uses SecretsManagerService to store access token

**Files to Create:**
- `packages/aws/amplify/functions/nueink-api/routers/PlaidRouter.ts`
- `packages/aws/amplify/functions/nueink-api/controllers/PlaidController.ts`

**Acceptance Criteria:**
- ✅ Token exchange endpoint works
- ✅ Access tokens stored securely in Secrets Manager
- ✅ IntegrationConfig and FinancialAccount records created
- ✅ Error handling for invalid tokens

---

### Phase 3: Frontend Plaid Link (Day 3)
**Goal:** Allow users to connect bank accounts via Plaid Link UI

#### Task 3.1: Install Dependencies
- Add `react-native-plaid-link-sdk` to `apps/native`
- Configure iOS and Android

#### Task 3.2: Create Plaid Link Hook
- **File:** `apps/native/hooks/usePlaidLink.ts`
- Wraps `react-native-plaid-link-sdk`
- Handles:
  - Creating link_token (call backend endpoint)
  - Opening Plaid Link
  - Receiving public_token on success
  - Calling token exchange endpoint
  - Triggering sync after connection

#### Task 3.3: Backend Link Token Endpoint
- **Endpoint:** `POST /plaid/create-link-token`
- Creates Plaid link_token for user
- Returns link_token to frontend

#### Task 3.4: Update Connect Accounts UI
- **File:** `apps/native/app/(protected)/settings/connect-accounts.tsx`
- Add "Connect via Plaid" button
- Show Plaid Link modal on click
- Display connected Plaid accounts
- Handle success/error states

**Files to Create/Modify:**
- `apps/native/hooks/usePlaidLink.ts`
- `packages/aws/amplify/functions/nueink-api/controllers/PlaidController.ts` (add createLinkToken method)
- `apps/native/app/(protected)/settings/connect-accounts.tsx` (modify)

**Acceptance Criteria:**
- ✅ User can click "Connect Bank Account"
- ✅ Plaid Link opens with real institutions
- ✅ On success, accounts are saved and appear in UI
- ✅ Error states handled gracefully

---

### Phase 4: Sync Lambda Integration (Day 4)
**Goal:** Wire up Plaid sync in existing sync Lambda to fetch transactions

#### Task 4.1: Update Sync Lambda
- **File:** `packages/aws/amplify/functions/financial/sync/handler.ts`
- Detect Plaid integrations (in addition to YNAB)
- For each Plaid integration:
  1. Load access_token from Secrets Manager
  2. Create PlaidIntegration instance
  3. Create PlaidSyncProvider
  4. Sync accounts and transactions
  5. Store in database via repositories

#### Task 4.2: Historical Data Sync
- Fetch 24 months of transactions on first sync:
  - `startDate = 24 months ago`
  - `endDate = today`
- For incremental syncs:
  - Track last sync time in IntegrationConfig
  - Only fetch new transactions since last sync

#### Task 4.3: Update Sync Service
- **File:** `packages/core/services/IntegrationSyncService.ts` (if exists)
- Or create new service to orchestrate sync across providers
- Handle both YNAB and Plaid

**Files to Modify:**
- `packages/aws/amplify/functions/financial/sync/handler.ts`
- May need to create shared sync orchestration service

**Acceptance Criteria:**
- ✅ Sync Lambda detects Plaid integrations
- ✅ Fetches 24 months of historical data on first sync
- ✅ Incremental sync fetches only new transactions
- ✅ Transactions saved to database
- ✅ Financial analysis shows data immediately

---

### Phase 5: Testing & Polish (Day 5)
**Goal:** Test end-to-end flow and handle edge cases

#### Task 5.1: End-to-End Testing
1. Connect bank account via Plaid Link (sandbox)
2. Verify accounts created in database
3. Trigger sync Lambda
4. Verify 24 months of transactions synced
5. Check Financial Analysis shows accurate data
6. Verify date parsing works correctly (no timezone bugs)

#### Task 5.2: Error Handling
- Invalid tokens
- Expired access tokens (need to re-link)
- Rate limiting from Plaid
- Network errors during sync
- Missing required fields

#### Task 5.3: UI Polish
- Loading states during Plaid Link
- Success/error messages
- Show sync status for Plaid accounts
- Display last sync time

#### Task 5.4: Documentation
- Update README with Plaid setup instructions
- Document environment variables needed
- Add Plaid secrets setup guide

**Acceptance Criteria:**
- ✅ End-to-end flow works in sandbox
- ✅ Error cases handled gracefully
- ✅ UI states polished
- ✅ Documentation updated

---

## Technical Architecture

### Data Flow

```
User → Plaid Link → Public Token
                         ↓
                   Backend Exchange
                         ↓
                   Access Token → Secrets Manager
                         ↓
                   Sync Lambda
                         ↓
        PlaidIntegration.getTransactions()
                         ↓
              PlaidTransactionConverter
                         ↓
              Transaction (Domain Model)
                         ↓
              TransactionRepository.save()
                         ↓
                   DynamoDB
                         ↓
              Financial Analysis Service
                         ↓
                    Dashboard
```

### Key Design Decisions

1. **Converters at Integration Boundary**
   - Similar to YNAB pattern
   - Plaid → NueInk conversion in dedicated converters
   - Keeps domain models clean

2. **Shared Date Utilities**
   - Use `parseTransactionDate` for transaction dates
   - Consistent with YNAB fix
   - Prevents timezone bugs

3. **Secure Token Storage**
   - Access tokens in Secrets Manager (not DynamoDB)
   - Encrypted at rest
   - Rotate on re-authentication

4. **Provider Agnostic Services**
   - FinancialSyncProvider interface works for both YNAB and Plaid
   - Sync Lambda doesn't care about provider
   - Easy to add more providers later

5. **No Deduplication (MVP)**
   - For MVP, users choose Plaid OR YNAB, not both
   - Add deduplication later if needed
   - Simplifies initial implementation

---

## Environment Setup

### Required Secrets (Sandbox)
```bash
# Plaid Sandbox Credentials
npx ampx sandbox secret set PLAID_CLIENT_ID
npx ampx sandbox secret set PLAID_SECRET
npx ampx sandbox secret set PLAID_ENV  # set to "sandbox"
```

### Plaid Dashboard Setup
1. Sign up at https://dashboard.plaid.com
2. Get sandbox credentials
3. Configure redirect URIs for OAuth
4. Enable Products: Transactions, Auth, Balance

---

## Success Metrics

### Technical Metrics
- ✅ Plaid Link success rate > 95%
- ✅ Token exchange success rate > 99%
- ✅ Sync completes in < 30 seconds for 2 years of data
- ✅ Zero timezone-related date bugs

### Product Metrics
- ✅ New user can see financial analysis in < 5 minutes
- ✅ Financial Discovery shows accurate averages with 2 years data
- ✅ Users prefer Plaid over YNAB for initial setup (A/B test)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Plaid API costs high | High | Start with sandbox, monitor usage, optimize syncs |
| Token expiration issues | Medium | Implement token refresh flow, clear error messages |
| Date parsing bugs | High | Reuse tested utilities, extensive date range testing |
| Slow sync for 2 years data | Medium | Paginate requests, show progress, background processing |
| User connects wrong accounts | Low | Clear account selection UI, confirmation step |

---

## Post-MVP Enhancements

### Phase 2 (Future)
- Deduplication between YNAB and Plaid
- Support for multiple Plaid items (multiple banks)
- Plaid transactions webhook for real-time updates
- Institution-specific optimizations
- Liabilities tracking (loans, credit cards)
- Investment account support

### Phase 3 (Future)
- Plaid Identity for income verification
- Plaid Balance for real-time balance checks
- Multi-region support (Plaid available in US, Canada, UK, EU)

---

## Notes

- **Plaid vs. YNAB Philosophy:**
  - YNAB: Budget-first, manual categorization, opinionated
  - Plaid: Data-first, automatic sync, flexible
  - NueInk: Discovery-first, AI categorization, insightful

- **Why Plaid Primary:**
  - Broader market (all banking customers vs. YNAB users)
  - Better historical data (24 months vs. 90 days)
  - Aligns with "Financial Discovery" value prop
  - Industry standard in fintech

- **YNAB as Complement:**
  - Keep for existing YNAB users
  - Import budget categories/goals
  - Sync YNAB's manual categorization
  - Not primary data source
