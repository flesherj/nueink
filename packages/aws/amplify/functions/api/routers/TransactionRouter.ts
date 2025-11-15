import { Router } from 'express';
import TransactionController from '../controllers/TransactionController';

const router = Router();

// GET /transaction/organization/:organizationId - List transactions by organization
router.get('/organization/:organizationId', TransactionController.listByOrganization);

// GET /transaction/account/:financialAccountId - List transactions by account
router.get('/account/:financialAccountId', TransactionController.listByAccount);

// GET /transaction/:transactionId - Get transaction by ID
router.get('/:transactionId', TransactionController.getTransaction);

export default router;
