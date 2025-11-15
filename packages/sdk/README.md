# @nueink/sdk

Official TypeScript SDK for NueInk applications.

## Overview

The NueInk SDK provides type-safe API clients for all NueInk operations including account management, financial integrations, and transaction syncing.

## Features

- ✅ **Type-Safe** - Full TypeScript support with domain models
- ✅ **Authenticated** - Automatic Cognito credential handling
- ✅ **React Native Safe** - No AWS SDK v3 dependencies
- ✅ **Auto-Configured** - Reads API endpoints from Amplify config

## Installation

```bash
yarn add @nueink/sdk
```

## Usage

### Integration API

```typescript
import { IntegrationApi } from '@nueink/sdk';

const integrationApi = IntegrationApi.create();

// List integrations for an account
const integrations = await integrationApi.listByAccount('account-123');

// Trigger manual sync
await integrationApi.triggerSync('account-123', 'ynab');
```

### Account API

```typescript
import { AccountApi } from '@nueink/sdk';

const accountApi = AccountApi.create();

// Get account by ID
const account = await accountApi.getAccount('account-123');

// List all accounts
const accounts = await accountApi.listAccounts();
```

## Authentication

All API calls are automatically authenticated using the current Cognito user session. The SDK uses `aws-amplify/api` which handles:

- JWT token retrieval from current session
- Authorization header injection
- Token refresh when needed

## Configuration

The SDK automatically loads API configuration from `amplify_outputs.json`. Ensure your app is configured with Amplify:

```typescript
import { NueInkAmplifyBuilder } from '@nueink/aws';

// Enable REST API support
NueInkAmplifyBuilder.builder().withApiSupport().build();
```

## Architecture

```
@nueink/sdk (Client SDK)
  ↓ uses aws-amplify/api
API Gateway (REST)
  ↓ Cognito auth
Lambda (Express)
  ↓ Services
Repositories
  ↓ AppSync/DynamoDB
```

## Future Additions

- React hooks (`useAccount`, `useIntegrations`)
- Client utilities (formatters, validators)
- WebSocket support for real-time updates
- Offline support with sync queue
