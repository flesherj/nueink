import { Router } from 'express';
import DebtController from '../controllers/DebtController';

const router = Router();

// Debt payoff plan generation
router.post('/payoff-plans', DebtController.generatePayoffPlans);

// Debt CRUD operations
router.get('/organization/:organizationId', DebtController.getByOrganization);
router.get('/active/:organizationId', DebtController.getActiveDebts);
router.get('/:debtId', DebtController.getById);
router.post('/', DebtController.create);
router.put('/:debtId', DebtController.update);
router.delete('/:debtId', DebtController.delete);

export default router;
