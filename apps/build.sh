#!/usr/bin/env bash
# Build NueInk Apps with OAuth Configuration
# This script loads OAuth configuration from AWS SSM Parameter Store and builds the app
#
# Usage:
#   ./build.sh [app] [command] [sandbox-identifier]
#
# Examples:
#   ./build.sh native ios              # Auto-detect sandbox (defaults to 'dev')
#   ./build.sh native start dev        # Use dev sandbox
#   ./build.sh native ios jamesflesher # Use jamesflesher sandbox
#   ./build.sh web start stage         # Use stage sandbox
#
# Sandbox identifier can be:
#   - Simple name: "dev", "jamesflesher", "stage", "prod"
#   - Full ID: "dev-sandbox-371f35b233"
#   - Empty: auto-detects (prefers 'dev')

set -e  # Exit on error

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

APP=${1:-native}
COMMAND=${2}
SANDBOX_ID=${3}

echo "========================================="
echo "Building NueInk App"
echo "App: $APP"
echo "========================================="

# Load OAuth configuration from AWS SSM Parameter Store
# Pass sandbox ID as parameter (auto-detects if empty)
source "$SCRIPT_DIR/env.config.sh" "$SANDBOX_ID"

# Navigate to app directory (relative to script location)
cd "$SCRIPT_DIR/$APP"

# Build commands
if [ "$APP" = "native" ]; then
  case "$COMMAND" in
    ios)
      echo "Building for iOS..."
      npx expo run:ios
      ;;
    android)
      echo "Building for Android..."
      npx expo run:android
      ;;
    start|"")
      echo "Starting development server..."
      npx expo start
      ;;
    *)
      echo "Unknown command: $COMMAND"
      echo "Available commands: ios, android, start"
      exit 1
      ;;
  esac
elif [ "$APP" = "web" ]; then
  case "$COMMAND" in
    start|"")
      echo "Starting web development server..."
      yarn web
      ;;
    build)
      echo "Building web app..."
      yarn build
      ;;
    *)
      echo "Unknown command: $COMMAND"
      echo "Available commands: start, build"
      exit 1
      ;;
  esac
else
  echo "Unknown app: $APP"
  echo "Available apps: native, web"
  exit 1
fi
