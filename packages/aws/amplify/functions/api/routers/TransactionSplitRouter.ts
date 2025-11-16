import { Router } from 'express';
import TransactionSplitController from '../controllers/TransactionSplitController';

const router = Router();

// GET /transaction-split/transaction/:transactionId - List splits by transaction
router.get('/transaction/:transactionId', TransactionSplitController.listByTransaction);

// GET /transaction-split/organization/:organizationId/category/:category - List splits by organization and category
router.get('/organization/:organizationId/category/:category', TransactionSplitController.listByOrganizationAndCategory);

// GET /transaction-split/:splitId - Get split by ID
router.get('/:splitId', TransactionSplitController.getSplit);

export default router;
