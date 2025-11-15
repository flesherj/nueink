import { Request, Response } from 'express';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { serviceFactory, awsFactory } from '../handler';

const eventBridge = new EventBridgeClient({});
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME!;

class IntegrationController {
  /**
   * GET /integration/:accountId
   * List integrations for an account
   */
  public listByAccount = async (
    req: Request<{ accountId: string }>,
    res: Response
  ) => {
    try {
      // Service has SecretManager (server-side), but we only use read operations
      const integrationService = serviceFactory.integrationConfig(
        awsFactory.secretsManager()
      );

      const integrations = await integrationService.findByAccountId(
        req.params.accountId
      );

      // Don't expose token data to client
      const sanitized = integrations.map((integration) => ({
        integrationId: integration.integrationId,
        accountId: integration.accountId,
        organizationId: integration.organizationId,
        provider: integration.provider,
        status: integration.status,
        syncedAt: integration.syncedAt,
        lastSyncError: integration.lastSyncError,
        syncEnabled: integration.syncEnabled,
        expiresAt: integration.expiresAt,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      }));

      res.json(sanitized);
    } catch (error: any) {
      console.error('Error listing integrations:', error);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /integration/:accountId/sync
   * Trigger manual sync for an integration
   * Body: { provider: 'ynab' | 'plaid' }
   */
  public triggerSync = async (
    req: Request<{ accountId: string }, any, { provider: string }>,
    res: Response
  ) => {
    try {
      const { accountId } = req.params;
      const { provider } = req.body;

      if (!provider) {
        return res.status(400).json({ error: 'provider required in body' });
      }

      // Publish event to EventBridge
      const command = new PutEventsCommand({
        Entries: [
          {
            Source: 'nueink.financial.manual',
            DetailType: 'ManualSyncTriggered',
            Detail: JSON.stringify({
              integrations: [{ accountId, provider }],
            }),
            EventBusName: EVENT_BUS_NAME,
          },
        ],
      });

      const result = await eventBridge.send(command);

      if (result.FailedEntryCount && result.FailedEntryCount > 0) {
        console.error('Failed to publish event:', result.Entries);
        return res.status(500).json({ error: 'Failed to trigger sync' });
      }

      res.json({
        message: 'Sync triggered successfully',
        accountId,
        provider,
      });
    } catch (error: any) {
      console.error('Error triggering sync:', error);
      res.status(500).json({ error: error.message });
    }
  };
}

export default new IntegrationController();
