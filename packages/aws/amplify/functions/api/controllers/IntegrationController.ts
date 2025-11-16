import { Request, Response } from 'express';
import { serviceFactory, awsFactory, Environment } from '../handler';

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
      const integrationService = serviceFactory.integration(
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
    } catch (error) {
      console.error('Error listing integrations:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to list integrations'
      });
    }
  };

  /**
   * POST /integration/:accountId/sync
   * Trigger manual sync for an integration
   * Body: { provider: 'ynab' | 'plaid', organizationId: string }
   */
  public triggerSync = async (
    req: Request<{ accountId: string }, any, { provider: string; organizationId: string }>,
    res: Response
  ) => {
    try {
      const { accountId } = req.params;
      const { provider, organizationId } = req.body;

      if (!provider) {
        return res.status(400).json({ error: 'provider required in body' });
      }

      if (!organizationId) {
        return res.status(400).json({ error: 'organizationId required in body' });
      }

      // Get EVENT_BUS_NAME from environment
      if (!Environment.eventBusName) {
        throw new Error('EVENT_BUS_NAME not configured');
      }

      // Create integration service with EventPublisher
      const integrationService = serviceFactory.integration(
        awsFactory.secretsManager(),
        awsFactory.eventBridge(Environment.eventBusName)
      );

      // Trigger sync via domain service
      await integrationService.triggerIntegrationSync(accountId, provider as any, organizationId);

      res.json({
        message: 'Sync triggered successfully',
        accountId,
        provider,
      });
    } catch (error) {
      console.error('Error triggering sync:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to trigger sync'
      });
    }
  };
}

export default new IntegrationController();
