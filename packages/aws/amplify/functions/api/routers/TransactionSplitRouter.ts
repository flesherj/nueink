import { Router } from 'express';
import TransactionSplitController from '../controllers/TransactionSplitController';

const router = Router();

// GET /transaction-split/transaction/:transactionId - List splits by transaction
router.get('/transaction/:transactionId', TransactionSplitController.listByTransaction);

// GET /transaction-split/organization/:organizationId/category/:category - List splits by organization and category
router.get('/organization/:organizationId/category/:category', TransactionSplitController.listByOrganizationAndCategory);

// GET /transaction-split/:splitId - Get split by ID
router.get('/:splitId', TransactionSplitController.getSplit);

// POST /transaction-split - Create a new split
router.post('/', TransactionSplitController.create);

// DELETE /transaction-split/:splitId - Delete a split
router.delete('/:splitId', TransactionSplitController.deleteSplit);

export default router;
