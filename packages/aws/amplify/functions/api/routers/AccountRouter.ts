import { Router } from 'express';
import AccountController from '../controllers/AccountController';

const router = Router();

// GET /account/:accountId - Get account by ID
router.get('/:accountId', AccountController.getAccount);

// GET /account - List all accounts (admin/dev only)
router.get('/', AccountController.listAccounts);

export default router;
