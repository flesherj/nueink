import { Request, Response } from 'express';
import { serviceFactory } from '../handler';

/**
 * TransactionSplit Controller
 * Handles HTTP requests for transaction split operations
 */
class TransactionSplitController {
  /**
   * List splits by transaction
   * GET /transaction-split/transaction/:transactionId
   */
  public listByTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transactionId } = req.params;

      const splitService = serviceFactory.transactionSplit();

      const splits = await splitService.findByTransaction(transactionId);

      res.json(splits);
    } catch (error) {
      console.error('Error listing splits by transaction:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to list splits by transaction'
      });
    }
  };

  /**
   * List splits by organization and category (for budget tracking)
   * GET /transaction-split/organization/:organizationId/category/:category?limit=50&cursor=...
   */
  public listByOrganizationAndCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId, category } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const cursor = req.query.cursor as string | undefined;

      const splitService = serviceFactory.transactionSplit();

      const result = await splitService.findByOrganizationAndCategory(
        organizationId,
        category,
        limit,
        cursor
      );

      res.json(result);
    } catch (error) {
      console.error('Error listing splits by organization and category:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to list splits by organization and category'
      });
    }
  };

  /**
   * Get split by ID
   * GET /transaction-split/:splitId
   */
  public getSplit = async (req: Request, res: Response): Promise<void> => {
    try {
      const { splitId } = req.params;
      const splitService = serviceFactory.transactionSplit();

      const split = await splitService.findById(splitId);

      if (!split) {
        res.status(404).json({ error: 'Split not found' });
        return;
      }

      res.json(split);
    } catch (error) {
      console.error('Error getting split:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get split'
      });
    }
  };

  /**
   * Create a new transaction split
   * POST /transaction-split
   */
  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      const splitData = req.body;
      const splitService = serviceFactory.transactionSplit();

      const newSplit = await splitService.create(splitData);

      res.status(201).json(newSplit);
    } catch (error) {
      console.error('Error creating split:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to create split'
      });
    }
  };

  /**
   * Delete a transaction split
   * DELETE /transaction-split/:splitId
   */
  public deleteSplit = async (req: Request, res: Response): Promise<void> => {
    try {
      const { splitId } = req.params;
      const splitService = serviceFactory.transactionSplit();

      await splitService.delete(splitId);

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting split:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to delete split'
      });
    }
  };
}

export default new TransactionSplitController();
