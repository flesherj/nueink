import type { generateClient } from 'aws-amplify/data';

/**
 * Type representing the AWS Amplify Data client
 * Used across all repository implementations
 *
 * Note: We use `any` here to avoid TypeScript stack depth issues
 * The actual type is inferred at runtime from the schema
 */
export type AmplifyDataClient = ReturnType<typeof generateClient<any>>;
