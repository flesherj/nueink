/**
 * Shared utilities for CDK infrastructure code
 * These are used at build/synthesis time, not runtime
 */

/**
 * Extracts sandbox ID from CloudFormation stack name
 * Pattern: amplify-{appName}-{environment}-sandbox-{hash}-...
 *
 * Example: amplify-nueinkaws-dev-sandbox-371f35b233-... → dev-sandbox-371f35b233
 *
 * @param stackName - CloudFormation stack name
 * @returns Sandbox ID (e.g., "dev-sandbox-371f35b233") or "default"
 */
export const deriveSandboxIdFromStackName = (stackName: string): string => {
  const match = stackName.match(/(\w+-sandbox-[a-f0-9]+)/);
  return match ? match[1] : 'default';
};

/**
 * Extracts a short unique identifier from CloudFormation stack name
 * Useful for resource naming with length constraints (e.g., EventBridge rules max 64 chars)
 *
 * Example: amplify-nueinkaws-dev-sandbox-371f35b233-nueinksyncstack187A310B-CRDPRAB1O33L → RAB1O33L
 *
 * @param stackName - CloudFormation stack name
 * @param length - Number of characters to extract from the end (default: 8)
 * @returns Short identifier
 */
export const deriveShortIdFromStackName = (stackName: string, length: number = 8): string => {
  const stackHash = stackName.split('-').slice(-1)[0] || 'default';
  return stackHash.substring(stackHash.length - length);
};
