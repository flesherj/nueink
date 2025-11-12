/**
 * SecretManager interface
 *
 * Platform-agnostic contract for secure secret storage.
 * Implementations handle the actual storage mechanism (AWS Secrets Manager, HashiCorp Vault, etc.)
 *
 * Business logic for secret naming, structure, and validation belongs in domain services,
 * not in SecretManager implementations.
 *
 * @example
 * // AWS implementation
 * const secretManager = new SecretsManagerService();
 * await secretManager.storeSecret('my-app/oauth/user-123/provider', { token: '...' });
 *
 * // Mock for testing
 * const mockSecretManager = new InMemorySecretManager();
 */

/**
 * Generic secret storage interface
 */
export interface SecretManager {
  /**
   * Store a new secret
   * @param secretName - Unique identifier for the secret
   * @param secretValue - Secret data (will be serialized to JSON)
   * @param tags - Optional metadata tags (for AWS: cost allocation, auditing, compliance)
   * @throws If secret already exists or operation fails
   */
  storeSecret(
    secretName: string,
    secretValue: Record<string, any>,
    tags?: Record<string, string>
  ): Promise<void>;

  /**
   * Retrieve a secret
   * @param secretName - Unique identifier for the secret
   * @returns Secret data or null if not found
   */
  getSecret(secretName: string): Promise<Record<string, any> | null>;

  /**
   * Update an existing secret
   * @param secretName - Unique identifier for the secret
   * @param secretValue - Updated secret data (will be serialized to JSON)
   * @throws If secret doesn't exist or operation fails
   */
  updateSecret(secretName: string, secretValue: Record<string, any>): Promise<void>;

  /**
   * Delete a secret
   * @param secretName - Unique identifier for the secret
   * @returns true if deleted, false if not found
   */
  deleteSecret(secretName: string): Promise<boolean>;

  /**
   * Check if a secret exists
   * @param secretName - Unique identifier for the secret
   */
  secretExists(secretName: string): Promise<boolean>;
}
