import { AwsAmplifyApiFactory } from './AwsAmplifyApiFactory';

/**
 * Sync API Client
 *
 * Client-side API for triggering manual data synchronization.
 * All requests are authenticated with Cognito credentials.
 */
export class SyncApi {
  private api = AwsAmplifyApiFactory.getInstance();

  public static create = () => new SyncApi();

  /**
   * Trigger manual sync for an organization
   * POST /sync/manual
   */
  public triggerManualSync = async (
    organizationId: string
  ): Promise<{ success: boolean; message: string }> => {
    console.log('Triggering manual sync for organization', organizationId);
    try {
      const response = await this.api.post('/sync/manual', { organizationId })
        .response;

      console.log('Manual sync triggered', response);

      return (await response.body.json()) as unknown as {
        success: boolean;
        message: string;
      };
    } catch (e) {
      console.error('Error triggering manual sync', e);
      return { success: false, message: (e as Error).message };
    }
  };
}
