# NueInk Product Roadmap

**Last Updated:** November 14, 2025
**Status:** Phase 1 - Financial Data Integration (40% complete)

---

## 🎯 Vision

**What is NueInk?**

"Instagram for Your Finances" - A social-first personal finance app that transforms money management into a collaborative, engaging experience for couples and families.

### Unique Value Propositions (NO competitor has these)

1. 🎭 **Social Transaction Feed** - Facebook-style feed with all transactions
2. 💬 **Comments on Transactions** - Discuss spending in context, reduce money fights
3. 👤 **Person Auto-Assignment** - One-time setup, 99% accuracy for "who spent what?"
4. 📸 **Receipt Scanning** - Camera + AWS Textract OCR + auto-matching
5. 📄 **Bill Scanning** - Scan bills, auto-extract details, create reminders

### Target Market

- **Primary:** Couples who argue about money (20M Mint refugees)
- **Secondary:** Families with teenagers learning finances
- **Pricing:** $6.99/month (half the price of competitors)

### Key Philosophy

- **Zero friction** - Only features requiring minimal user effort
- **Auto-everything** - Auto-assign, auto-categorize, auto-update
- **Social-first** - Make finance engaging, not boring
- **Stupid simple** - "If it's hard, people won't do it"

**Detailed Vision Documents:**
- [NUEINK_ASSESSMENT.md](./NUEINK_ASSESSMENT.md)
- [MARKET_DISRUPTION_ANALYSIS.md](./MARKET_DISRUPTION_ANALYSIS.md)
- [SIMPLIFIED_MVP_PLAN.md](./SIMPLIFIED_MVP_PLAN.md)

---

## 📊 Progress Overview

**Timeline to MVP:** 4-6 weeks remaining (as of Nov 14, 2025)

### Phase Completion Status

| Phase | Status | Progress | Target |
|-------|--------|----------|--------|
| **Phase 0: Architecture** | ✅ Complete | 100% | Week 1 |
| **Phase 1: Integration** | 🔄 In Progress | 40% | Weeks 1-2 |
| **Phase 1.9: Gift Cards & Widget** | ⏭️ Planned | 0% | 1-2 days |
| **Phase 2: Social Feed** | ⏭️ Next | 0% | Weeks 3-4 |
| **Phase 3: Intelligence** | ⏭️ Planned | 0% | Weeks 5-6 |
| **Phase 4: Receipts & Bills** | ⏭️ Planned | 0% | Weeks 7-8 |
| **Phase 5: Polish & Launch** | ⏭️ Planned | 0% | Week 8+ |
| **Phase 6: Future** | 💭 Ideas | 0% | Post-MVP |

---

## Phase Summaries

### ✅ Phase 0: Architectural Foundation (Complete)

**Completed:** November 11, 2025

**Goal:** Clean architecture, TypeScript compilation, repository pattern

**Achievements:**
- Repository pattern with generics (all 10 services)
- Clean architecture separation (core vs aws)
- TypeScript compilation fixed (all packages)
- Event architecture with dependency injection
- Monorepo build scripts for Yarn Classic

**Reference:** See COMPLETED.md for detailed task list

---

### 🔄 Phase 1: Financial Data Integration (40% Complete)

**Target:** Weeks 1-2 (Nov 11-24, 2025)

**Goal:** Connect financial accounts, sync transactions automatically

**Completed:**
- ✅ OAuth integration (YNAB working)
- ✅ Financial account sync (19 accounts synced)
- ✅ Transaction sync (DynamoDB storage working)
- ✅ EventBridge automation (schedule + event-driven)
- ✅ REST API & SDK package for client operations

**In Progress:**
- [ ] Mobile UI for accounts list
- [ ] Transaction feed UI
- [ ] Pull-to-refresh manual sync

**Success Criteria:**
- User connects YNAB/Plaid account
- Transactions sync automatically every 4 hours
- User sees accounts and transactions in mobile app
- Manual sync works from UI

**Reference:** See CURRENT.md for active tasks

---

### ⏭️ Phase 1.9: Gift Cards & Widget Foundation (Planned)

**Estimate:** 1-2 days

**Goal:** Low-effort, high-value additions that increase daily engagement

**Features:**
- **Gift Card Tracking:** Track gift cards as financial accounts (people always lose these!)
- **Home Screen Widget:** Display financial snapshot on device home screen
- **Privacy Mode:** Hide balances in widget when phone locked

**Why Now:**
- Gift cards = 5-minute model extension, huge UX win
- Widget groundwork = enables daily engagement before social features
- Both increase "stickiness" and investor metrics (DAU/MAU)

**Technical Notes:**
- App Groups (iOS) / Shared Preferences (Android) for widget data
- Widget limitations: No biometric prompts (platform restriction)
- See original TASKS.md Phase 1.9 for detailed specification

---

### ⏭️ Phase 2: Social Financial Feed (Planned)

**Target:** Weeks 3-4

**Goal:** Instagram-style feed for financial activities with comments

**Features:**
- Social transaction feed (Facebook-style)
- Comments on transactions (discuss spending in context)
- @mentions for family members
- Real-time updates via AppSync subscriptions
- Reactions and engagement

**Architecture:**
- Dedicated FeedItem table
- DynamoDB Streams → Feed Generation Lambda
- Single AppSync subscription per client
- Server-side aggregation

**Success Criteria:**
- Feed shows transactions, budget alerts, account updates
- Can comment on any feed item
- Real-time updates appear instantly
- Infinite scroll works smoothly

**Reference:** See ARCHITECTURE.md for feed architecture decisions

---

### ⏭️ Phase 3: Financial Intelligence (Planned)

**Target:** Weeks 5-6

**Goal:** Budgets, spending insights, alerts

**Features:**
- Budget creation and tracking
- Spending aggregation by category
- Budget alerts and notifications
- Analytics dashboard
- Smart insights ("You spent 30% more on dining this month")

**Success Criteria:**
- User can create monthly budget
- See spending vs budget in real-time
- Receive alerts when approaching limits
- View spending trends and insights

---

### ⏭️ Phase 4: Receipt & Bill Intelligence (Planned)

**Target:** Weeks 7-8

**Goal:** Scan receipts and bills, auto-match to transactions

**Features:**
- Receipt camera capture
- AWS Textract OCR processing
- Auto-match receipt to transaction
- Bill scanning with payment reminders
- Line-item categorization

**Success Criteria:**
- Can scan receipt with camera
- Receipt auto-matches to transaction
- Can scan bills and set reminders
- Line items extracted accurately

---

### ⏭️ Phase 5: Polish & Launch (Planned)

**Target:** Week 8+

**Goal:** Performance, testing, security, beta launch

**Features:**
- Performance optimization
- Comprehensive error handling
- Security hardening
- Testing (unit, integration, E2E)
- Monitoring and alerts
- Beta launch preparation

**Success Criteria:**
- App performs well under load
- Errors handled gracefully
- Security audit passed
- Test coverage > 80%
- Beta users onboarded successfully

---

### 💭 Phase 6: Future Enhancements (Post-MVP)

**Target:** Post-launch

**Possible Features:**
- AI/ML for transaction categorization
- Additional integrations (Plaid, Monarch, etc.)
- Advanced person auto-assignment
- Export and reporting
- Web application
- External REST API

**Reference:** See PARKED.md for all future ideas

---

## Key Architectural Decisions

**Clean Architecture:**
- `@nueink/core` = Platform-agnostic (React Native safe)
- `@nueink/aws` = AWS-specific (Lambda only)
- `@nueink/sdk` = Client API access

**Financial Sync:**
- EventBridge scheduler (not SQS)
- Direct to DynamoDB (cache tables later if needed)
- CloudWatch EMF for free metrics

**Social Feed:**
- Dedicated FeedItem table
- Server-side aggregation
- AppSync subscriptions for real-time

**Real-Time Strategy:**
- Current: AppSync subscriptions + REST polling
- Phase 2: Add AWS IoT Core (~20x cheaper at scale)

**Reference:** See ARCHITECTURE.md for complete technical decisions

---

## Timeline & Milestones

### Completed Milestones

- ✅ **Pivot Decision** (November 2025) - Committed to financial focus
- ✅ **Infrastructure Assessment** (100% reusable)
- ✅ **Strategic Planning** (15 comprehensive docs created)
- ✅ **Architectural Refactoring** (Nov 11)
- ✅ **OAuth Integration** (Nov 14)
- ✅ **Financial Sync Working** (Nov 14)

### Upcoming Milestones

- ⏭️ **Accounts UI** (Nov 15-16) - Display synced accounts
- ⏭️ **Transaction Feed UI** (Nov 17-18) - Show transactions
- ⏭️ **Social Feed MVP** (Week 4) - Comments on transactions
- ⏭️ **Beta Launch** (Week 8) - First users

---

*Last updated: November 14, 2025 by James Flesher*
