# NueInk Finance: Simplified MVP Plan

**Last Updated:** November 8, 2025

---

## Core Philosophy: SIMPLE > COMPLEX

> "If it's hard people won't do it but if it's stupid simple there will be less of a blocker."

**Principle:** Only build features that require ZERO or MINIMAL user effort.

---

## Phase 1: MVP (8 Weeks) - Launch to Beta

### Must-Have Features:

**1. Transaction Feed (Social)**
- Auto-populated from bank (Plaid/YNAB)
- Most recent at top
- Facebook/Instagram-style infinite scroll
- Zero user effort

**2. Person Auto-Assignment**
- One-time setup: Map cards to people
- Automatic assignment forever after
- Filter by person with one tap
- 99% accuracy for individual cards

**3. Comments on Transactions**
- Tap transaction → Add comment
- Like texting with your partner
- Real-time sync
- Notifications

**4. Simple Filters**
- Filter by person (Sarah, James, Shared)
- Filter by institution (Chase, Wells Fargo)
- Filter by category (Groceries, Gas, etc.)
- One-tap access

**5. Basic Budget Dashboard**
- Auto-calculated from transactions
- Visual progress bars
- "Spent vs Budget" comparison
- Zero data entry

**6. Debt Payoff Tracker**
- Track total debt
- Show monthly progress
- Visual payoff timeline
- Updates automatically

---

## Phase 2: Tax Features (4 Weeks) - Post-Launch Addition

**Only build after MVP is live and validated!**

### Receipt/Bill Features (NO OCR):

**7. Receipt Photo Attachment**
- Tap transaction → Attach photo
- Simple photo storage (S3)
- No OCR, no auto-extraction
- For tax purposes only

**8. Tax Export**
- Filter business expenses
- Export PDF + receipt images
- Download ZIP file
- Give to accountant

**9. Manual Bill Entry**
- Simple form: name, amount, due date
- Optional photo attachment
- Basic reminders (3 days, 1 day, day-of)
- No automation

---

## Phase 3: Advanced (Only If Users Request)

**DO NOT BUILD unless users demand it:**

- AWS Textract OCR
- Auto-extraction from receipts/bills
- Email-to-bill processing
- Advanced analytics
- Recurring transaction detection
- Budget recommendations
- ML-based insights

**Let users tell you what they need!**

---

## Development Timeline

### Week 1-2: Foundation
- ✅ Existing NueInk auth (already built)
- Plaid integration setup
- Fetch transactions
- Basic data models

### Week 3-4: Transaction Feed
- Build feed UI (React Native)
- Auto-sync transactions
- Pull-to-refresh
- Infinite scroll

### Week 5: Person Assignment
- Account-to-person mapping
- Auto-assignment logic
- Filter implementation
- Settings screen

### Week 6: Comments
- Comment UI
- Real-time sync
- Notifications
- Feed integration

### Week 7: Budget Dashboard
- Budget UI
- Category tracking
- Progress visualization
- Simple charts

### Week 8: Debt Tracker
- Debt visualization
- Progress tracking
- Payoff timeline
- Polish & beta testing

**Launch Beta: End of Week 8**

---

## What Makes NueInk Unique

**Core differentiators (all in Phase 1):**
1. ✅ Social transaction feed (NO competitor has this)
2. ✅ Comments on transactions (NO competitor has this)
3. ✅ Person-level tracking (NO competitor has this)

**Everything else is table stakes:**
- Budget dashboard (everyone has this)
- Debt tracking (some have this)
- Transaction sync (everyone has this)

**The social features ARE your moat.**

---

## What We're NOT Building (For Now)

**Cut from MVP:**
- ❌ Receipt scanning with OCR (Phase 2, no OCR)
- ❌ Bill scanning with OCR (Phase 2, no OCR)
- ❌ Email-to-bill processing (Phase 3, maybe never)
- ❌ Automatic bill reminders (Phase 2, basic only)
- ❌ Budget recommendations (Phase 3)
- ❌ Advanced analytics (Phase 3)
- ❌ Investment tracking (Way later)
- ❌ Net worth tracking (Phase 3)

**Why cut these?**
- Too much complexity
- Adds friction
- Not core to the "social finance" value proposition
- Can add later if users request

---

## Feature Complexity Analysis

### ✅ Low Friction (Keep in MVP)

**Transaction Feed:**
- User effort: ZERO (automatic)
- Engagement: DAILY (like social media)
- Value: Immediate (see all your money)

**Person Assignment:**
- User effort: 5 minutes once
- Engagement: WEEKLY (filter by person)
- Value: Immediate (answer "how much did Sarah spend?")

**Comments:**
- User effort: LOW (like texting)
- Engagement: 2-3x per week
- Value: Reduces arguments about money

**Filters:**
- User effort: ONE TAP
- Engagement: DAILY
- Value: Instant answers

**Budget Dashboard:**
- User effort: ZERO (auto-calculated)
- Engagement: DAILY
- Value: "Am I on track?"

**Debt Tracker:**
- User effort: ZERO (auto-updates)
- Engagement: WEEKLY
- Value: Motivation, progress

---

### ⚠️ Medium Friction (Phase 2 Only)

**Receipt Photos (no OCR):**
- User effort: MEDIUM (have to remember to take photo)
- Engagement: RARE (only for business expenses)
- Value: Tax deductions only
- **Verdict:** Phase 2, simple photo storage

**Bill Tracking:**
- User effort: MEDIUM (manual entry)
- Engagement: MONTHLY (recurring bills)
- Value: Reminders for bills not on autopay
- **Verdict:** Phase 2, basic reminders only

---

### ❌ High Friction (Phase 3 or Never)

**Receipt Scanning with OCR:**
- User effort: HIGH (scan every receipt)
- Reality: Nobody does this consistently
- **Verdict:** Phase 3, only if users beg for it

**Email-to-Bill:**
- User effort: HIGH (update 15+ billers)
- Complexity: HIGH (security, approval flow)
- Value: LOW (autopay already exists)
- **Verdict:** Probably never

---

## Success Metrics (MVP)

**Week 8 (Beta Launch):**
- 10 beta users (family + friends)
- Daily active usage (checking feed)
- 5+ comments per user per week
- 90% satisfaction score

**Month 3 (Public Launch):**
- 100 users
- 50% daily active users
- 10+ comments per day across platform
- First paying customer

**Month 6:**
- 1,000 users
- $6.99/month subscription
- 200 paying customers
- $1,400 MRR

---

## Tech Stack (MVP)

**Mobile App:**
- Expo SDK 53 (React Native)
- React Native Paper (UI components)
- Expo Router (navigation)
- TypeScript

**Backend:**
- AWS Amplify Gen 2
- AWS Cognito (auth - already built!)
- AWS Lambda (serverless functions)
- AWS DynamoDB (database)
- AWS API Gateway (REST API)

**Integrations:**
- Plaid API (bank connections)
- YNAB API (optional, for YNAB users)

**Infrastructure:**
- AWS S3 (receipt/bill photos - Phase 2)
- AWS CloudWatch (monitoring)
- GitHub Actions (CI/CD)

---

## Cost Estimate (MVP)

**Development (Weeks 1-8):**
- AWS Amplify: $0 (free tier)
- Plaid: $0 (sandbox is free)
- Development time: FREE (you're building it)

**Beta Testing (10 users):**
- AWS costs: ~$2/month
- Plaid: FREE (under 100 accounts)
- Total: $2/month

**Phase 2 (Receipts, if added):**
- S3 storage: ~$0.50/month
- No Textract (no OCR in Phase 2)
- Total: $2.50/month

**Extremely affordable to validate!**

---

## Pivot from Original Plan

**What changed:**
- ❌ Cut email-to-bill processing (too complex)
- ❌ Cut OCR/Textract from MVP (Phase 3 only)
- ❌ Cut automatic bill tracking (Phase 2, basic only)
- ✅ Kept social feed (core value)
- ✅ Kept person assignment (unique)
- ✅ Kept comments (engagement driver)
- ⚠️ Moved receipts to Phase 2 (no OCR)

**Result:**
- Faster to ship: 8 weeks instead of 12-16
- Simpler to use: Less friction
- Easier to maintain: Less complexity
- Proves the concept: Social finance works?

---

## Decision Framework: Should We Build X?

**Ask these questions:**

1. **How much user effort does this require?**
   - ZERO = Build in MVP
   - LOW = Build in MVP
   - MEDIUM = Phase 2
   - HIGH = Phase 3 or never

2. **How often will users engage with this?**
   - DAILY = Must-have
   - WEEKLY = Nice-to-have
   - MONTHLY = Phase 2
   - RARELY = Don't build

3. **Does any competitor have this?**
   - NO = Competitive advantage (prioritize!)
   - YES = Table stakes (build basic version)

4. **Can it be automated?**
   - YES = Build it
   - NO = Reconsider or simplify

**Example:**

**Email-to-bill processing:**
1. User effort: HIGH (update all billers)
2. Engagement: MONTHLY (bills arrive)
3. Competitors: NO (unique!)
4. Automated: PARTIAL (requires approval)

**Verdict:** Phase 3 or cut entirely (too much friction)

**Transaction feed:**
1. User effort: ZERO (automatic)
2. Engagement: DAILY (like Instagram)
3. Competitors: NO (unique!)
4. Automated: YES (fully automatic)

**Verdict:** Core MVP feature! ✅

---

## Launch Strategy

**Week 8: Soft Launch (Beta)**
- Family testing (you + Sarah)
- 5-10 close friends
- Private beta (invite only)
- Gather feedback

**Week 12: Public Beta**
- Twitter announcement (build in public)
- Post on Reddit (r/ynab, r/personalfinance)
- Product Hunt (maybe)
- First 100 users

**Month 4: Paid Launch**
- Add subscription ($6.99/month)
- Grandfather beta users (free for life)
- Start marketing push
- First revenue!

---

## Build in Public Plan

**Start NOW (before launch):**
- Tweet progress daily
- Share screenshots
- Weekly dev logs
- Build audience

**By launch (Week 8):**
- 500-1,000 Twitter followers
- Warm audience ready to try
- Word-of-mouth momentum
- Free marketing

**Resources:**
- See `SOCIAL_MEDIA_STRATEGY.md` for full plan
- See `BUILD_IN_PUBLIC_RISKS.md` for risk analysis

---

## Bottom Line

**MVP = 6 features, 8 weeks**

1. Transaction feed (auto)
2. Person assignment (one-time setup)
3. Comments (easy)
4. Filters (one tap)
5. Budget dashboard (auto)
6. Debt tracker (auto)

**Everything else = Phase 2 or later**

**Ship fast. Get feedback. Iterate.**

**Simple > Complex. Always.**

---

**Ready to build? Let's go! 🚀**
