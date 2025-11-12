# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NueInk is a React Native monorepo built with Expo and AWS Amplify Gen2, providing both native mobile and web applications for data attribute management and organization workflows.

## Monorepo Structure

This is a Yarn workspaces monorepo with the following structure:

- `apps/native` - React Native mobile app using Expo Router
- `apps/web` - React Native Web application
- `packages/aws` - AWS Amplify backend configuration and client SDK
- `packages/ui` - Shared React Native UI components
- `packages/core` - Core business logic and utilities (experimental OpenAI integration)

## Development Commands

### AWS Amplify Sandbox

The AWS Amplify sandbox is the primary backend development environment:

```bash
# Start sandbox (dev environment)
yarn sandbox:dev

# Delete sandbox
yarn sandbox:dev:delete
```

Note: Uses AWS profile `solotech` with identifier `dev`. Must set up secrets before first run (see Secrets Management below).

### Running Applications

```bash
# Native iOS
yarn ios

# Native Android
yarn android

# Web
yarn web
```

### Code Quality

```bash
# Format code
yarn format

# Check formatting
yarn lint
```

### Testing

```bash
# Run tests with Jest
jest

# Run specific test file
jest path/to/test.spec.ts
```

## Secrets Management

AWS Amplify secrets are managed via the Amplify CLI. Set secrets before running sandbox:

```bash
npx ampx sandbox secret set {secret_name}
```

Required secrets (defined in `packages/aws/amplify/auth/resource.ts`):
- `SIWA_TEAM_ID`, `SIWA_PRIVATE_KEY`, `SIWA_KEY_ID`, `SIWA_CLIENT_ID` - Sign In with Apple
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google OAuth
- `AMAZON_CLIENT_ID`, `AMAZON_CLIENT_SECRET` - Amazon OAuth
- `FB_CLIENT_ID`, `FB_CLIENT_SECRET` - Facebook OAuth
- `OPEN_API_FIELD_SEARCH_KEY` - OpenAI API key for field search

## Architecture

### AWS Amplify Backend

The backend is configured using AWS Amplify Gen2 with custom CDK constructs:

**Entry Point**: `packages/aws/amplify/backend.ts`

Defines:
- Cognito authentication with social providers (Apple, Google, Facebook, Amazon)
- AppSync GraphQL API with DynamoDB data models
- Lambda functions (post-confirmation trigger, REST API handler)
- API Gateway REST API with Cognito authorizer
- IAM policies for authenticated/unauthenticated access

**Data Schema**: `packages/aws/amplify/data/resource.ts`

Core models:
- `Account` - User accounts with email/username indices
- `Organization` - Hierarchical organizations
- `Membership` - Account-to-organization relationships
- `Attribute` / `UserAttribute` - Flexible attribute system
- `DataRequest` / `RequestFulfillment` - Data request workflow

Authorization uses owner-based access control via `profileOwner` field. Default mode is API key for Lambda access.

**Lambda Functions**:
- `post-confirmation` trigger (`packages/aws/amplify/auth/post-confirmation/`) - Creates Account record after user signup
- `nueink-api` function (`packages/aws/amplify/functions/nueink-api/`) - Express.js REST API with serverless-http

### Client SDK Pattern

The `@nueink/aws` package provides builder pattern APIs:

**NueInkAmplifyBuilder**: Configures Amplify client with optional REST API support
```typescript
NueInkAmplifyBuilder.builder()
  .withApiSupport()
  .withResourceConfig(resourceConfig)
  .withLibraryOptions(libraryOptions)
  .build();
```

**NueInkDataClientBuilder**: Creates typed GraphQL client
```typescript
const client = NueInkDataClientBuilder.builder().build();
```

**Service Layer**: `packages/aws/services/` contains domain services (AccountService, OrganizationService, MembershipService) that wrap the GraphQL client

**API Layer**: `packages/aws/api/` contains REST API clients using AwsAmplifyApiFactory

### REST API Architecture

The Express-based Lambda function (`packages/aws/amplify/functions/nueink-api/handler.ts`) uses:
- Express.js with CORS
- Router-based organization (e.g., `routers/AccountRouter.ts`)
- Controller pattern (e.g., `controllers/AccountController.ts`)
- Serverless-http for Lambda integration

Accessible via API Gateway at `/dev` stage with both proxy (`/*`) and Cognito-protected (`/cognito-auth-path`) routes.

### Mobile/Web Apps

Both apps use:
- Expo Router for navigation (native app uses file-based routing in `app/` directory)
- React Native Paper for UI components
- AWS Amplify for authentication and data access
- Shared `@nueink/ui` component library

Native app includes dev client for custom native code.

## Key Configuration Files

- `package.json` - Root workspace configuration and scripts
- `jest.config.js` - Jest testing configuration with react-native preset
- `.prettierrc` - Code formatting: 80 char width, single quotes, ES5 trailing commas
- `eas.json` - Expo Application Services build configuration
- `packages/aws/amplify_outputs.json` - Generated Amplify configuration (not in git)

## Coding Standards

### Function Declarations

**Always use arrow functions when possible:**

- **Class methods**: Use arrow function properties (class fields) for all methods
- **Access modifiers**: Always be explicit with `public` and `private` keywords
  ```typescript
  // ✅ Correct
  class MyService {
    public myMethod = (param: string): string => {
      return param;
    };

    private helperMethod = (param: string): string => {
      return param;
    };
  }

  // ❌ Avoid
  class MyService {
    myMethod(param: string): string {  // No access modifier, not arrow function
      return param;
    }
  }
  ```

- **Standalone functions**: Use arrow function expressions
  ```typescript
  // ✅ Correct
  export const myFunction = (param: string): string => {
    return param;
  };

  // ❌ Avoid
  export function myFunction(param: string): string {
    return param;
  }
  ```

**Benefits**: Arrow functions preserve `this` context, provide consistent syntax across the codebase, and work well with functional programming patterns.

### Architecture Patterns

**Secret Management:**

- **Core package** defines business logic and interfaces
  - `SecretManager` interface - Platform-agnostic secret storage contract
  - Domain services (e.g., `IntegrationConfigService`) handle:
    - Secret naming conventions
    - Data structure and serialization
    - Business validation
    - Calling SecretManager for storage

- **AWS package** provides infrastructure implementations
  - `SecretsManagerService` - Generic AWS Secrets Manager implementation
  - NO business logic - just storage operations (store/get/update/delete)
  - Reusable for any secret type (tokens, API keys, webhooks, etc.)

**Example:**
```typescript
// Core: IntegrationConfigService handles integration-specific logic
const integrationService = new IntegrationConfigService(repository, secretManager);
await integrationService.storeTokens('account-123', 'ynab', {
  accessToken: '...',
  refreshToken: '...',
  expiresAt: new Date()
});

// AWS: SecretsManagerService is generic infrastructure
const secretManager = new SecretsManagerService();
await secretManager.storeSecret('my-secret-name', { key: 'value' });
```

## Important Notes

- **Profile Owner Authorization**: All protected models use `profileOwner` field for authorization. Ensure this is set to the Cognito user ID on create.
- **API Key Mode**: Data resources use API key as default authorization to allow Lambda function access. Client apps should use Cognito auth.
- **Workspace Dependencies**: Use `yarn workspace <name> <command>` to run commands in specific workspaces, or root-level scripts which delegate to workspaces.
- **TypeScript**: All packages use TypeScript with strict mode. Main entry points use `index.ts` with explicit exports.
- **Amplify Gen2 Pattern**: Backend uses defineBackend, defineAuth, defineData, defineFunction APIs (not Amplify Gen1 CLI).
