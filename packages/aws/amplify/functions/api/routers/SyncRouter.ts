import { Router } from 'express';
import SyncController from '../controllers/SyncController';

const router = Router();

// POST /sync/manual - Trigger manual sync for an organization
router.post('/manual', SyncController.triggerManualSync);

export default router;
