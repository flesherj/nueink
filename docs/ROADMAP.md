# NueInk Product Roadmap

**Last Updated:** November 16, 2025
**Status:** Phase 1 Complete ✅ | Phase 2 Partial (35%) | Next: Phase 1.9

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

**Timeline to MVP:** 3-5 weeks remaining (as of Nov 16, 2025)

### Phase Completion Status

| Phase | Status | Progress | Target |
|-------|--------|----------|--------|
| **Phase 0: Architecture** | ✅ Complete | 100% | Week 1 |
| **Phase 1: Integration** | ✅ Complete | 100% | Weeks 1-2 |
| **Phase 1.9: Gift Cards & Widget** | ⏭️ Next | 0% | 1-2 days |
| **Phase 2: Social Feed** | 🔄 Partial | 35% | Weeks 3-4 |
| **Phase 3: Intelligence** | 🔄 Partial | 15% | Weeks 5-6 |
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

### ✅ Phase 1: Financial Data Integration (100% Complete)

**Completed:** November 16, 2025

**Goal:** Connect financial accounts, sync transactions automatically

**Achievements:**
- ✅ OAuth integration (YNAB working)
- ✅ Financial account sync (19 accounts synced)
- ✅ Transaction sync (DynamoDB storage working)
- ✅ EventBridge automation (schedule + event-driven)
- ✅ REST API & SDK package for client operations
- ✅ **Accounts List UI** - Grouped by provider, balances, pull-to-refresh
- ✅ **Transaction Feed UI** - Date grouping, pagination, infinite scroll
- ✅ **Transaction Detail UI** - Comments, category allocation, spending charts
- ✅ **Pull-to-refresh** - Manual sync on both accounts and transactions
- ✅ **Category Allocation** - Visual progress bars, segmented display
- ✅ **Contextual Charts** - Daily totals, smart label positioning (Phase 2 feature done early!)

**Success Criteria: ✅ ALL MET**
- ✅ User connects YNAB/Plaid account
- ✅ Transactions sync automatically every 4 hours
- ✅ User sees accounts and transactions in mobile app
- ✅ Manual sync works from UI

**Bonus Features Completed Ahead of Schedule:**
- Category allocation progress bars (from Phase 2)
- Contextual spending charts with timeline (from Phase 2)
- Merchant intelligence with visual context (from Phase 3)

---

### 🔄 Phase 1.9: Dashboard & Intelligence Foundation (In Progress)

**Target:** 1-2 days

**Goal:** Build "Financial GPS" dashboard - passive, always-on awareness vs manual budgeting

**Decision:** Deferred native widgets to Phase 5 (Polish) - Dashboard provides more value for MVP

**💡 KEY INSIGHT - The NueInk Differentiator:**

**YNAB's Problem:**
- Requires knowing spending habits upfront to create budget
- Manual categorization feels like work
- Batch processing (sit down once a month)
- No real-time "where am I?" awareness
- Ignores pay period cycles

**NueInk's Solution: "Connect and Discover"**
- ✅ Zero setup - AI learns YOUR patterns automatically
- ✅ Auto-categorization (effortless, not homework)
- ✅ Always-on awareness - know your position anytime
- ✅ Passive discovery - app tells YOU your habits
- ✅ Pay period aware - "what's left THIS cycle?"
- ✅ Proactive insights - "here's what I found about you"

**Dashboard as "Financial GPS"** - Answers real questions:
1. "How much can I spend right now?" → What's Left card
2. "What bills are coming up?" → Upcoming Bills card
3. "Am I on track this month?" → Spending Pace card
4. "What are my actual habits?" → AI Discovered Patterns card
5. "What just happened?" → Recent Transactions (auto-categorized)
6. "How can I save?" → Actionable Suggestions card

**Implementation Order (Vertical Slices):**

**Slice 1: "What You Have Left" Card** (Start here)
- Total balance across all accounts
- Detect/predict upcoming bills (recurring transactions)
- Days until next paycheck (user setting or AI detect)
- Calculate: Balance - Upcoming Bills = Available to Spend
- Shows user their real spending power RIGHT NOW

**Slice 2: "What's Coming Up" Card**
- List of bills due before next paycheck
- Estimated amounts (from recurring patterns)
- Total impact on available funds
- Tap to mark as paid or adjust estimate

**Slice 3: "This Month So Far" Card**
- Total spent vs your typical pattern (not budget)
- Pace indicator (day 16 of 30, spent 45%, normal = 53%)
- Top category with comparison to usual
- Anomaly detection (dining out ↑ 23% vs usual)

**Slice 4: "AI Discovered" Card**
- Your spending patterns (groceries ~$400/mo)
- Recurring merchants and amounts
- Day-of-week/time patterns
- No user input required!

**Slice 5: "Recent Transactions" Card**
- Last 3-5 transactions
- Show auto-categorization confidence
- Quick edit if AI got it wrong
- Reinforce that app is working for you

**Slice 6: "Quick Insight" Card**
- Proactive suggestion based on data
- Actionable (cut 2 dinners = save $120)
- Positive framing (celebrate wins)

**Technical Architecture:**
- RecurringTransactionDetector service (AI/pattern matching)
- SpendingPatternAnalyzer service (discovers habits)
- AvailableFundsCalculator service (real-time math)
- Reuse existing transaction/account data
- Cache insights, refresh daily or on-sync

---

### ⏭️ Phase 2: Social Financial Feed (Planned)

**Target:** Weeks 3-4

**Goal:** Instagram-style feed for financial activities with comments

**Core Features:**
- Social transaction feed (Facebook-style)
- Comments on transactions (discuss spending in context)
- @mentions for family members
- Real-time updates via AppSync subscriptions
- Reactions and engagement

**Visual Enhancements (NEW):**
- **Category Allocation Progress** - Progress bar + badge showing allocation status
  - "72% allocated" or "$25.88 of $35.88 categorized"
  - Visual indicator of incomplete categorization
  - Quick glance at how transaction is split

- **Contextual Spending Charts** - Mini charts showing transaction in context
  - **Category Context:** Where this transaction fits in monthly category spending
  - **Timeline:** X-axis = days in period, Y-axis = cumulative spending
  - **Highlight:** Pointer showing where THIS transaction occurred
  - **Budget Line:** Optional overlay showing budget threshold
  - Example: "This was your 3rd grocery purchase, putting you at 32% of budget on day 9"

**Architecture:**
- Dedicated FeedItem table
- DynamoDB Streams → Feed Generation Lambda
- Single AppSync subscription per client
- Server-side aggregation
- Chart library: `victory-native` or `react-native-svg`

**Success Criteria:**
- Feed shows transactions, budget alerts, account updates
- Can comment on any feed item
- Real-time updates appear instantly
- Infinite scroll works smoothly
- Users can see allocation status at a glance
- Charts provide meaningful spending context

**Reference:** See ARCHITECTURE.md for feed architecture decisions

---

### ⏭️ Phase 3: Financial Intelligence (Planned)

**Target:** Weeks 5-6

**Goal:** Budgets, spending insights, alerts, intelligent feed generation

**Core Features:**
- Budget creation and tracking
- Spending aggregation by category
- Budget alerts and notifications
- Analytics dashboard
- Smart insights ("You spent 30% more on dining this month")

**Enhanced Features (NEW):**

**Merchant Intelligence:**
- **Merchant Grouping** - Click merchant → see all transactions from that merchant
- **Merchant Analytics** - Spending trends at specific merchants over time
- **Merchant Categories** - See category breakdown for each merchant
  - Example: Target purchases split across Groceries (60%), Household (25%), Clothes (15%)
- **Merchant Charts** - Contextual charts showing spending patterns per merchant
- **Merchant Budget Impact** - How this merchant affects overall budget categories

**Auto-Generated Feed Insights:**
- **Algorithmic Feed Items** - System automatically generates insight cards in feed
- **Context-Aware Triggers** - Deterministic rules that generate insights

  **Feed Item Types:**
  - 🔵 **Transactions** (blue border) - Actual purchases
  - 🟢 **Celebrations** (green border) - Positive trends, savings achievements
  - 🟡 **Alerts** (yellow border) - Budget warnings, attention needed
  - 🟣 **Milestones** (purple border) - First time achievements, streaks
  - 📊 **Summaries** (neutral) - Daily/weekly/monthly recaps

  **Trigger Examples:**
  - Daily: "Yesterday you spent $127 across 5 transactions"
  - Weekly: "You spent $487 this week (12% above your average)"
  - Budget: "You've used 78% of dining budget with 10 days left in month"
  - Celebration: "You're on track to save $400 this month! 🎉"
  - Trend: "Grocery spending down 15% vs last month"
  - Alert: "At current rate, you'll exceed dining budget by $200"
  - Milestone: "First week under budget in 3 months!"
  - Comparative: "Spending 23% less than same period last year"

**Technical Implementation:**
- **Merchant Data Model** - Track merchant metadata, spending history
- **Insight Engine** - Lambda triggered by EventBridge rules (daily/weekly/budget-based)
- **Feed Item Generator** - Creates typed feed items based on trigger conditions
- **Trend Detection** - Analyze spending patterns over rolling windows (3-week, 1-month, 3-month)
- **Budget Burn Rate** - Calculate projected spending vs actual pace

**Success Criteria:**
- User can create monthly budget
- See spending vs budget in real-time
- Receive alerts when approaching limits
- View spending trends and insights
- Click merchant to see all related transactions
- Feed shows auto-generated insights based on spending patterns
- Insights are timely, relevant, and actionable

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
- **Home Screen Widgets** (iOS & Android)
  - Financial snapshot widget
  - Privacy mode for locked screen
  - App Groups / Shared Preferences data sharing
- **Gift Card Tracking** (if time permits)
- Beta launch preparation

**Success Criteria:**
- App performs well under load
- Errors handled gracefully
- Security audit passed
- Test coverage > 80%
- Widgets working on both platforms (nice-to-have)
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

*Last updated: November 16, 2025 by James Flesher*
