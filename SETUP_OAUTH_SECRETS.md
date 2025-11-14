# OAuth Secrets Setup Guide

## Problem
YNAB OAuth token exchange is failing because the Lambda function doesn't have access to required secrets.

Error: `invalid_grant - does not match the redirection URI used in the authorization request`

## Required Secrets

Based on `packages/aws/amplify/functions/financial/connect/resource.ts`, you need to set:

### YNAB Secrets
```bash
# Set the redirect URI (MUST match amplify_outputs.json)
npx ampx sandbox secret set YNAB_REDIRECT_URI
# Enter: https://0his4brcz1.execute-api.us-east-1.amazonaws.com/oauth/callback

# Set the token URL
npx ampx sandbox secret set YNAB_TOKEN_URL
# Enter: https://app.ynab.com/oauth/token

# Set your YNAB OAuth credentials (from YNAB developer portal)
npx ampx sandbox secret set YNAB_CLIENT_ID
# Enter: <your YNAB client ID>

npx ampx sandbox secret set YNAB_CLIENT_SECRET
# Enter: <your YNAB client secret>
```

### Plaid Secrets (if using Plaid)
```bash
npx ampx sandbox secret set PLAID_CLIENT_ID
npx ampx sandbox secret set PLAID_SECRET
npx ampx sandbox secret set PLAID_ENVIRONMENT
# Enter: sandbox, development, or production
```

## Important Notes

1. **Redirect URI MUST match exactly**:
   - The value in `YNAB_REDIRECT_URI` secret
   - The value in `amplify_outputs.json` (`custom.oauthCallbackUrl`)
   - The value registered in your YNAB OAuth app settings

2. **Get YNAB credentials**:
   - Go to https://app.ynab.com/settings/developer
   - Create a new OAuth application
   - Set the redirect URI to: `https://0his4brcz1.execute-api.us-east-1.amazonaws.com/oauth/callback`
   - Copy the Client ID and Client Secret

3. **After setting secrets**:
   - Redeploy your sandbox: `yarn sandbox:dev` (it should pick up the new secrets)
   - Or restart if already running

## Verification

After setting secrets, verify they're set:
```bash
npx ampx sandbox secret list
```

You should see:
- YNAB_REDIRECT_URI
- YNAB_TOKEN_URL
- YNAB_CLIENT_ID
- YNAB_CLIENT_SECRET
- PLAID_CLIENT_ID (if using Plaid)
- PLAID_SECRET (if using Plaid)
- PLAID_ENVIRONMENT (if using Plaid)

## Testing

After configuration:
1. Open the mobile app
2. Go to Settings > Connect Accounts
3. Tap "Connect YNAB"
4. Complete OAuth flow
5. Check CloudWatch logs - should see successful token exchange
