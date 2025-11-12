/**
 * AWS Secrets Manager Service
 *
 * Generic secret storage implementation using AWS Secrets Manager.
 * Implements SecretManager interface from @nueink/core.
 *
 * This service has NO business logic - it only handles storage operations.
 * Secret naming, structure, and validation belong in domain services.
 *
 * Usage:
 * ```typescript
 * const secretManager = new SecretsManagerService();
 *
 * // Store any JSON-serializable data
 * await secretManager.storeSecret('my-app/config/feature-flags', {
 *   darkMode: true,
 *   betaFeatures: ['feature1', 'feature2']
 * });
 *
 * // Retrieve secret
 * const config = await secretManager.getSecret('my-app/config/feature-flags');
 * ```
 */

import {
  SecretsManagerClient,
  CreateSecretCommand,
  GetSecretValueCommand,
  UpdateSecretCommand,
  DeleteSecretCommand,
  ResourceNotFoundException,
} from '@aws-sdk/client-secrets-manager';
import type { SecretManager } from '@nueink/core';

/**
 * AWS Secrets Manager implementation of SecretManager
 */
export class SecretsManagerService implements SecretManager {
  private client: SecretsManagerClient;

  constructor(region?: string) {
    this.client = new SecretsManagerClient({ region: region || process.env.AWS_REGION });
  }

  /**
   * Store a new secret
   */
  public storeSecret = async (
    secretName: string,
    secretValue: Record<string, any>,
    tags?: Record<string, string>
  ): Promise<void> => {
    const secretString = JSON.stringify(secretValue);

    // Convert tags object to AWS tag format
    const awsTags = tags
      ? Object.entries(tags).map(([Key, Value]) => ({ Key, Value }))
      : undefined;

    try {
      await this.client.send(
        new CreateSecretCommand({
          Name: secretName,
          SecretString: secretString,
          Tags: awsTags,
        })
      );
    } catch (error: any) {
      // If secret already exists, throw error (caller should use updateSecret)
      if (error.name === 'ResourceExistsException') {
        throw new Error(`Secret already exists: ${secretName}`);
      }
      throw new Error(`Failed to store secret: ${error.message}`);
    }
  };

  /**
   * Retrieve a secret
   */
  public getSecret = async (secretName: string): Promise<Record<string, any> | null> => {
    try {
      const response = await this.client.send(
        new GetSecretValueCommand({
          SecretId: secretName,
        })
      );

      if (!response.SecretString) {
        return null;
      }

      return JSON.parse(response.SecretString);
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        return null;
      }
      throw new Error(`Failed to retrieve secret: ${error.message}`);
    }
  };

  /**
   * Update an existing secret
   */
  public updateSecret = async (secretName: string, secretValue: Record<string, any>): Promise<void> => {
    const secretString = JSON.stringify(secretValue);

    try {
      await this.client.send(
        new UpdateSecretCommand({
          SecretId: secretName,
          SecretString: secretString,
        })
      );
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw new Error(`Secret does not exist: ${secretName}`);
      }
      throw new Error(`Failed to update secret: ${error.message}`);
    }
  };

  /**
   * Delete a secret
   */
  public deleteSecret = async (secretName: string): Promise<boolean> => {
    try {
      await this.client.send(
        new DeleteSecretCommand({
          SecretId: secretName,
          ForceDeleteWithoutRecovery: true, // Immediate deletion for security
        })
      );
      return true;
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        return false; // Already deleted
      }
      throw new Error(`Failed to delete secret: ${error.message}`);
    }
  };

  /**
   * Check if a secret exists
   */
  public secretExists = async (secretName: string): Promise<boolean> => {
    const secret = await this.getSecret(secretName);
    return secret !== null;
  };
}
