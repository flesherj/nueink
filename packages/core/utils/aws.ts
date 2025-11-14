/**
 * AWS-specific utilities for extracting environment information
 * These are platform-specific but reusable across Lambda functions
 */

/**
 * Extracts the sandbox ID from a CloudFormation stack name or path
 *
 * Stack names/paths follow the pattern:
 * amplify-{appName}-{environment}-sandbox-{hash}-...
 * OR /amplify/{appName}/{environment}-sandbox-{hash}/...
 *
 * Example: amplify-nueinkaws-dev-sandbox-371f35b233-nueinkeventsstackE09CDB6C-X30KR4TPRK5G
 * Extracts: dev-sandbox-371f35b233
 *
 * @param stackNameOrPath - CloudFormation stack name or SSM path
 * @returns Sandbox ID (e.g., "dev-sandbox-371f35b233") or "default"
 */
export const deriveSandboxIdFromStackName = (stackNameOrPath: string): string => {
  const match = stackNameOrPath.match(/(\w+-sandbox-[a-f0-9]+)/);
  return match ? match[1] : 'default';
};

/**
 * Extracts the sandbox ID from Amplify environment configuration
 *
 * Amplify provides AMPLIFY_SSM_ENV_CONFIG which contains SSM paths like:
 * /amplify/nueinkaws/dev-sandbox-371f35b233/...
 *
 * @param ssmConfig - AMPLIFY_SSM_ENV_CONFIG JSON string (defaults to env var)
 * @returns Sandbox ID (e.g., "dev-sandbox-371f35b233") or "default"
 */
export const deriveSandboxId = (
  ssmConfig: string = process.env.AMPLIFY_SSM_ENV_CONFIG || ''
): string => {
  if (!ssmConfig) {
    return 'default';
  }

  try {
    const config = JSON.parse(ssmConfig);
    // Get the first SSM path to extract sandbox ID from
    const firstKey = Object.keys(config)[0];
    if (!firstKey) {
      return 'default';
    }

    const path = config[firstKey]?.path || '';
    // Path is like: /amplify/nueinkaws/dev-sandbox-371f35b233/...
    return deriveSandboxIdFromStackName(path);
  } catch {
    return 'default';
  }
};

/**
 * Derives the EventBridge event bus name from the Amplify sandbox ID
 *
 * @param ssmConfig - AMPLIFY_SSM_ENV_CONFIG JSON string (defaults to env var)
 * @returns Event bus name for the current sandbox (e.g., "nueink-events-dev-sandbox-371f35b233")
 */
export const deriveEventBusName = (
  ssmConfig: string = process.env.AMPLIFY_SSM_ENV_CONFIG || ''
): string => {
  const sandboxId = deriveSandboxId(ssmConfig);
  return `nueink-events-${sandboxId}`;
};
