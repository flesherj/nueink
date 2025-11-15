# NueInk - Parked Ideas & Future Features

**Purpose:** Capture all brainstormed features regardless of current fit. As the product evolves, some of these may become relevant and move into active phases.

**Instructions:** Never delete ideas from this section. Add new ideas with date and source. Mark with priority when reviewed.

---

## Gamification & Engagement (November 11, 2025)

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

## Chores Integration (November 11, 2025)

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

## Academic Performance Tracking (November 11, 2025)

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

## Widget Check-In & Engagement Tracking (November 11, 2025)

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

## Smart Home Integration (November 11, 2025)

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

## Receipt Email Auto-Processing (November 11, 2025)

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

## Offline Widget with Biometric Privacy (November 11, 2025)

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

## Parent-Child Advanced Features (November 11, 2025)

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

## Review Schedule

**Quarterly Review:** Last Sunday of each quarter
- Review all parked ideas
- Evaluate fit based on current product state
- Move relevant ideas to active phases
- Archive ideas that no longer make sense

**Next Review:** March 31, 2026

---

*Last updated: November 14, 2025*
