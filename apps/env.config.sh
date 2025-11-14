#!/bin/bash
# Extract OAuth configuration from AWS SSM Parameter Store for mobile app builds
# These are PUBLIC values (client IDs, redirect URIs) that are safe to bundle in the app
# Client secrets remain in AWS and are only accessed by Lambda functions
#
# Usage: source ./env.config.sh [sandbox-id]
#
# The sandbox ID is the unique identifier for your Amplify sandbox (e.g., jamesflesher-sandbox-c61b4e546f)
# Parameters are stored by Amplify at: /amplify/nueinkaws/{sandbox-id}/

# Get directory of this script (works even when sourced)
ENV_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

AWS_PROFILE=${AWS_PROFILE:-solotech}
AWS_REGION=${AWS_REGION:-us-east-1}

SANDBOX_IDENTIFIER=${1}

# Function to resolve full sandbox ID from identifier
resolve_sandbox_id() {
  local identifier=$1

  # If identifier looks like a full sandbox ID (contains "sandbox-" with hash), use as-is
  if [[ "$identifier" =~ sandbox-[a-f0-9]+ ]]; then
    echo "$identifier" | head -1
    return 0
  fi

  # Otherwise, search for sandbox with this identifier prefix
  local full_id=$(aws ssm describe-parameters \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --parameter-filters "Key=Name,Option=BeginsWith,Values=/amplify/nueinkaws/${identifier}-sandbox" \
    --query 'Parameters[0].Name' \
    --output text 2>/dev/null | sed 's/.*\/amplify\/nueinkaws\/\([^\/]*\).*/\1/' | head -1)

  if [ -n "$full_id" ]; then
    echo "$full_id" | head -1
    return 0
  fi

  # Fallback: try to find any sandbox
  aws ssm describe-parameters \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --parameter-filters "Key=Name,Option=BeginsWith,Values=/amplify/nueinkaws/" \
    --query 'Parameters[0].Name' \
    --output text 2>/dev/null | sed 's/.*\/amplify\/nueinkaws\/\([^\/]*\).*/\1/' | head -1

  return 0
}

# Resolve sandbox ID
if [ -n "$SANDBOX_IDENTIFIER" ]; then
  # User provided an identifier (e.g., "dev", "jamesflesher", or full ID)
  SANDBOX_ID=$(resolve_sandbox_id "$SANDBOX_IDENTIFIER" | tr -d '\n\r' | head -1)
else
  # Auto-detect from deployed sandbox
  SANDBOX_ID=$(resolve_sandbox_id "dev" | tr -d '\n\r' | head -1)
  if [ -z "$SANDBOX_ID" ]; then
    # If no dev sandbox, try any sandbox
    SANDBOX_ID=$(aws ssm describe-parameters \
      --profile $AWS_PROFILE \
      --region $AWS_REGION \
      --parameter-filters "Key=Name,Option=BeginsWith,Values=/amplify/nueinkaws/" \
      --query 'Parameters[0].Name' \
      --output text 2>/dev/null | sed 's/.*\/amplify\/nueinkaws\/\([^\/]*\).*/\1/' | tr -d '\n\r' | head -1)
  fi
fi

SANDBOX_ID=$(echo "$SANDBOX_ID" | tr -d '\n\r')
SANDBOX_ID=${SANDBOX_ID:-dev-sandbox}

echo "Loading OAuth config for sandbox: $SANDBOX_ID"

# Function to get SSM parameter value
get_parameter() {
  local param_name=$1
  aws ssm get-parameter \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --name "/amplify/nueinkaws/$SANDBOX_ID/$param_name" \
    --with-decryption \
    --query 'Parameter.Value' \
    --output text 2>/dev/null
}

# Get OAuth public configuration from SSM Parameter Store
export YNAB_CLIENT_ID=$(get_parameter "YNAB_CLIENT_ID")
export YNAB_AUTH_URL="https://app.ynab.com/oauth/authorize"
export PLAID_CLIENT_ID=$(get_parameter "PLAID_CLIENT_ID")
export PLAID_ENVIRONMENT=$(get_parameter "PLAID_ENVIRONMENT")

# Validate required values are present
if [ -z "$YNAB_CLIENT_ID" ] || [ -z "$PLAID_CLIENT_ID" ]; then
  echo "Error: OAuth parameters not found at /amplify/nueinkaws/$SANDBOX_ID/"
  echo ""
  echo "Available sandbox IDs:"
  aws ssm get-parameters-by-path \
    --profile $AWS_PROFILE \
    --region $AWS_REGION \
    --path "/amplify/nueinkaws/" \
    --query "Parameters[].Name" \
    --output text 2>/dev/null | grep -o 'sandbox-[a-f0-9]\+' | sort -u
  exit 1
fi

# Get OAuth callback URL from amplify_outputs.json if it exists
# amplify_outputs.json is in packages/aws/ (relative to repo root)
AMPLIFY_OUTPUTS="$ENV_SCRIPT_DIR/../packages/aws/amplify_outputs.json"
if [ -f "$AMPLIFY_OUTPUTS" ]; then
  export OAUTH_CALLBACK_URL=$(cat "$AMPLIFY_OUTPUTS" | jq -r '.custom.oauthCallbackUrl // empty')
fi

echo "✓ OAuth configuration loaded successfully"
echo "  YNAB_CLIENT_ID: ${YNAB_CLIENT_ID:0:10}..."
echo "  PLAID_CLIENT_ID: ${PLAID_CLIENT_ID:0:10}..."
echo "  PLAID_ENVIRONMENT: $PLAID_ENVIRONMENT"
if [ -n "$OAUTH_CALLBACK_URL" ]; then
  echo "  OAUTH_CALLBACK_URL: $OAUTH_CALLBACK_URL"
fi

# Return success
return 0 2>/dev/null || true
