import { Router } from 'express';
import IntegrationController from '../controllers/IntegrationController';

const router = Router();

// GET /integration/:accountId - List integrations for account
router.get('/:accountId', IntegrationController.listByAccount);

// POST /integration/:accountId/sync - Trigger manual sync
router.post('/:accountId/sync', IntegrationController.triggerSync);

export default router;
