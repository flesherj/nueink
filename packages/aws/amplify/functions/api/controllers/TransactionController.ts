import { Request, Response } from 'express';
import { serviceFactory } from '../handler';

/**
 * Transaction Controller
 * Handles HTTP requests for transaction operations
 */
class TransactionController {
  /**
   * List transactions by organization
   * GET /transaction/organization/:organizationId?limit=50&cursor=...
   */
  public listByOrganization = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const cursor = req.query.cursor as string | undefined;

      const transactionService = serviceFactory.transaction();

      const result = await transactionService.findByOrganization(organizationId, limit, cursor);

      res.json(result);
    } catch (error) {
      console.error('Error listing transactions by organization:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to list transactions by organization'
      });
    }
  };

  /**
   * List transactions by financial account
   * GET /transaction/account/:financialAccountId?limit=50&cursor=...
   */
  public listByAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      const { financialAccountId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const cursor = req.query.cursor as string | undefined;

      const transactionService = serviceFactory.transaction();

      const result = await transactionService.findByFinancialAccount(financialAccountId, limit, cursor);

      res.json(result);
    } catch (error) {
      console.error('Error listing transactions by account:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to list transactions by account'
      });
    }
  };

  /**
   * Get transaction by ID
   * GET /transaction/:transactionId
   */
  public getTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transactionId } = req.params;
      const transactionService = serviceFactory.transaction();

      const transaction = await transactionService.findById(transactionId);

      if (!transaction) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      res.json(transaction);
    } catch (error) {
      console.error('Error getting transaction:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get transaction'
      });
    }
  };
}

export default new TransactionController();
