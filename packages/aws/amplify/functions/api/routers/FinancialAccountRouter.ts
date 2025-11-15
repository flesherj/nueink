import { Router } from 'express';
import FinancialAccountController from '../controllers/FinancialAccountController';

const router = Router();

// GET /financial-account/organization/:organizationId - List accounts by organization
router.get('/organization/:organizationId', FinancialAccountController.listByOrganization);

// GET /financial-account/institution/:institutionId - List accounts by institution
router.get('/institution/:institutionId', FinancialAccountController.listByInstitution);

// GET /financial-account/:financialAccountId - Get account by ID
router.get('/:financialAccountId', FinancialAccountController.getAccount);

export default router;
