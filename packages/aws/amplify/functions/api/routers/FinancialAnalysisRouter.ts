import { Router } from 'express';
import FinancialAnalysisController from '../controllers/FinancialAnalysisController';

const router = Router();

// GET /financial-analysis/analyze/:organizationId/:accountId - Analyze spending for organization
router.get('/analyze/:organizationId/:accountId', FinancialAnalysisController.analyzeSpending);

export default router;
