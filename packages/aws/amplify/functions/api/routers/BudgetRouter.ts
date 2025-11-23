import { Router } from 'express';
import BudgetController from '../controllers/BudgetController';

const router = Router();

// POST /budget/from-analysis - Create baseline budget from financial analysis
router.post('/from-analysis', BudgetController.createFromAnalysis);

// GET /budget/active/:organizationId - Get active budget for organization
router.get('/active/:organizationId', BudgetController.getActiveBudget);

// GET /budget/organization/:organizationId - Get all budgets for organization
router.get('/organization/:organizationId', BudgetController.getBudgetsByOrganization);

// GET /budget/:budgetId - Get budget by ID
router.get('/:budgetId', BudgetController.getBudgetById);

export default router;
