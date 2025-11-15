# NueInk Development Documentation

**Last Updated:** November 14, 2025
**Owner:** James Flesher
**Project Status:** 🟡 Development - Phase 1 (Financial Data Integration)

---

## Quick Links

- **[CURRENT.md](./CURRENT.md)** - Active sprint, current tasks, next steps (👈 **START HERE**)
- **[ROADMAP.md](./ROADMAP.md)** - Product vision, phases, and future plans
- **[COMPLETED.md](./COMPLETED.md)** - Archive of finished work (chronological)
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical decisions, patterns, deferred features
- **[PARKED.md](./PARKED.md)** - Ideas for future consideration

---

## How to Use This Documentation

### 🚀 Starting a New Session?
→ Read **[CURRENT.md](./CURRENT.md)** to see what's in progress and what's next

### 📋 Planning Next Phase?
→ Check **[ROADMAP.md](./ROADMAP.md)** for product vision and planned features

### 🔍 Looking for Past Context?
→ Search **[COMPLETED.md](./COMPLETED.md)** for what's been done and why

### 🏗️ Technical Questions?
→ Review **[ARCHITECTURE.md](./ARCHITECTURE.md)** for architectural decisions

### 💡 Brainstorming Features?
→ Browse **[PARKED.md](./PARKED.md)** for ideas and future possibilities

---

## Current Status (November 14, 2025)

### Phase 1 Progress: 40% Complete

**Completed:**
- ✅ OAuth integration (YNAB working)
- ✅ Financial account sync (19 accounts synced)
- ✅ Transaction sync (DynamoDB storage working)
- ✅ EventBridge automation
- ✅ REST API & SDK package

**In Progress:**
- 🔄 Mobile UI for accounts list
- 🔄 Transaction feed UI
- 🔄 Pull-to-refresh manual sync

**Up Next:**
1. Display synced accounts in mobile app
2. Show transactions in feed format
3. Add pull-to-refresh for manual sync
4. Real-time sync notifications (AWS IoT Core)

---

## Documentation Organization

This documentation was split from a single monolithic TASKS.md file (2,905 lines / 100KB / 29,216 tokens) on November 14, 2025.

### Why Split?

**Problems with single file:**
- ❌ Exceeded token limits for AI assistants (25K limit)
- ❌ Hard to navigate and find relevant information
- ❌ Git diffs polluted with unrelated changes
- ❌ Slow to load and search

**Benefits of split structure:**
- ✅ Each file stays under token limits
- ✅ Easier to find relevant info (current work vs history)
- ✅ Cleaner git diffs (current tasks separate from archive)
- ✅ Can reference specific sections without loading everything
- ✅ Better organization for team members and contributors

### File Sizes (as of Nov 14, 2025)

| File | Lines | Purpose |
|------|-------|---------|
| **CURRENT.md** | ~300 | Active work (refreshed weekly) |
| **ROADMAP.md** | ~250 | Product vision (stable) |
| **COMPLETED.md** | ~200 | Historical archive (append-only) |
| **ARCHITECTURE.md** | ~300 | Technical decisions (updated as needed) |
| **PARKED.md** | ~200 | Future ideas (reviewed quarterly) |

---

## Project Context

**What is NueInk?**

"Instagram for Your Finances" - A social-first personal finance app for couples and families.

**Unique Value:**
- 🎭 Social transaction feed (like Instagram)
- 💬 Comments on transactions (reduce money fights)
- 👤 Auto-assign transactions to people (99% accuracy)
- 📸 Receipt scanning with OCR
- 📄 Bill scanning with reminders

**Target Market:**
- Couples who argue about money (20M Mint refugees)
- Families with teenagers learning finances
- Pricing: $6.99/month

**See:** [ROADMAP.md](./ROADMAP.md) for full vision

---

## Quick Reference

### Key Commands

```bash
# Start AWS sandbox
yarn sandbox:dev

# Delete sandbox
yarn sandbox:dev:delete

# Run native app
yarn ios        # iOS simulator
yarn android    # Android emulator
yarn web        # Web browser

# Build packages
yarn build

# Type check
yarn typecheck

# Format code
yarn format
```

### Key Directories

```
apps/
  native/           # React Native mobile app (Expo)
  web/              # React Native Web app

packages/
  aws/              # AWS Amplify backend + infrastructure
  core/             # Platform-agnostic business logic
  sdk/              # Client REST API access
  ui/               # Shared React Native components
  ynab/             # YNAB integration
  plaid/            # Plaid integration (future)
```

### Important Files

- `packages/aws/amplify/backend.ts` - AWS infrastructure configuration
- `packages/aws/amplify/data/resource.ts` - DynamoDB schema
- `apps/native/app/(protected)/_layout.tsx` - Protected app layout
- `packages/core/services/NueInkServiceFactory.ts` - Service factory pattern

---

## Related Documentation

### Strategy & Planning
- `docs/NUEINK_ASSESSMENT.md` - Comprehensive product assessment
- `docs/MARKET_DISRUPTION_ANALYSIS.md` - Competitive analysis
- `docs/SIMPLIFIED_MVP_PLAN.md` - MVP strategy

### Technical
- `docs/SOCIAL_FEED_ANALYSIS.md` - Feed architecture analysis
- `CLAUDE.md` - Project instructions for AI assistants

---

*Documentation reorganized November 14, 2025 by James Flesher*

*For questions or suggestions about this documentation structure, create an issue or discuss with the team.*
