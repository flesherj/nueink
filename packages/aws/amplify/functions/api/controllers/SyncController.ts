import { Request, Response } from 'express';
import { serviceFactory, awsFactory, Environment } from '../handler';

/**
 * Sync Controller
 * Handles manual sync trigger requests
 */
class SyncController {
  /**
   * Trigger manual sync for an organization
   * POST /sync/manual
   * Body: { organizationId: string }
   */
  public triggerManualSync = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId } = req.body;

      if (!organizationId) {
        res.status(400).json({ error: 'organizationId is required' });
        return;
      }

      console.log('Triggering manual sync for organization:', organizationId);

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
      await integrationService.triggerManualSync(organizationId);

      console.log('Manual sync event published successfully');

      res.json({
        success: true,
        message: 'Sync triggered successfully',
        organizationId,
      });
    } catch (error: any) {
      console.error('Error triggering manual sync:', error);
      res.status(500).json({ error: error.message });
    }
  };
}

export default new SyncController();
