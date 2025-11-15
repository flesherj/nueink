import { Request, Response } from 'express';
import { serviceFactory } from '../handler';

/**
 * Financial Account Controller
 * Handles HTTP requests for financial account operations
 */
class FinancialAccountController {
  /**
   * List financial accounts by organization
   * GET /financial-account/organization/:organizationId?limit=50&cursor=...
   */
  public listByOrganization = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const cursor = req.query.cursor as string | undefined;

      const financialAccountService = serviceFactory.financialAccount();

      const result = await financialAccountService.findByOrganization(organizationId, limit, cursor);

      res.json(result);
    } catch (error: any) {
      console.error('Error listing financial accounts by organization:', error);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Get financial account by ID
   * GET /financial-account/:financialAccountId
   */
  public getAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      const { financialAccountId } = req.params;
      const financialAccountService = serviceFactory.financialAccount();

      const account = await financialAccountService.findById(financialAccountId);

      if (!account) {
        res.status(404).json({ error: 'Financial account not found' });
        return;
      }

      res.json(account);
    } catch (error: any) {
      console.error('Error getting financial account:', error);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * List financial accounts by institution
   * GET /financial-account/institution/:institutionId
   */
  public listByInstitution = async (req: Request, res: Response): Promise<void> => {
    try {
      const { institutionId } = req.params;
      const financialAccountService = serviceFactory.financialAccount();

      const accounts = await financialAccountService.findByInstitution(institutionId);

      res.json(accounts);
    } catch (error: any) {
      console.error('Error listing financial accounts by institution:', error);
      res.status(500).json({ error: error.message });
    }
  };
}

export default new FinancialAccountController();
