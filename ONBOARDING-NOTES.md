# Onboarding Planning Notes

> **📋 For current development status and all tasks, see [docs/TASKS.md](/docs/TASKS.md)**
>
> This file contains historical onboarding planning notes. Active development is now tracked in TASKS.md.

## Current Status (2025-11-11)

### Completed Today
✅ **Amplify Authenticator Theming**
- Created `createAmplifyTheme()` helper in `packages/ui/src/NueInkTheme.ts` that converts React Native Paper themes to Amplify UI format
- Exported `NueInkAmplifyDarkTheme` and `NueInkAmplifyLightTheme`
- Updated `apps/native/app/_layout.tsx` to use `ThemeProvider` with `useColorScheme()` hook
- Fixed `app.json` setting from `"userInterfaceStyle": "light"` to `"automatic"`
- Result: Authenticator now matches NueInk's purple/teal theme and responds to OS appearance changes

### Decision: Defer Detailed Onboarding

**Rationale:** "Don't know what we don't know yet"

Need to build integrations first to understand:
- YNAB API behavior (token validation, data structures, multi-budget handling)
- Plaid Link flow (account types, categorization, error states)
- Core feature requirements (what data we actually need from users)
- Data model (how everything fits together)

## Onboarding Ideas Brainstormed

### Essential Data to Collect

**For YNAB Users (Priority 1):**
- YNAB Personal Access Token
- Budget selection (if multiple)
- Sync preferences
- Account mapping

**For Plaid Users (Priority 2):**
- Bank connection via Plaid Link
- Account selection
- Initial categorization preferences

**Universal:**
- Financial goals (optional, can defer)
- Primary currency (if international)
- Notifications (optional, can defer)

### UX Approaches Considered

1. **"The 3-Tap Onboarding"** - Minimal friction, connect → import → success
2. **"Conversational Onboarding"** - Progressive disclosure with personality
3. **"Preview First, Connect Later"** - Show demo data before asking for connection

### Smart Defaults Strategy
Don't ask users for non-critical settings:
- Import ALL accounts (hide later if needed)
- Use existing category names
- Enable all sync options
- Default notification settings

## Recommended Development Path

```
1. ✅ Skip onboarding (create bypass for dev)
2. ⏭️ Build YNAB integration (learn the API)
3. ⏭️ Build Plaid integration (learn the API)
4. ⏭️ Build core features (understand what data matters)
5. ⏭️ Design proper onboarding (now you know what to ask for)
```

## Next Steps

### Immediate (For Development)
- [ ] Create simple onboarding bypass that routes directly to main app
- [ ] Set up test data manually in database for development
- [ ] Start YNAB API integration exploration

### Future (After Integrations Built)
- [ ] Design actual onboarding flow based on learned requirements
- [ ] Build onboarding screens
- [ ] Test with real YNAB/Plaid connections

## Target Users
- **Primary:** YNAB users (You Need A Budget)
- **Secondary:** Plaid-connected users
- **Goal:** Get users from signup to first "wow" moment in under 60 seconds

## Notes
- Current onboarding placeholder exists at `apps/native/app/(protected)/onboard/`
- User authentication via Amplify Cognito is already working
- Account creation happens via post-confirmation Lambda trigger
