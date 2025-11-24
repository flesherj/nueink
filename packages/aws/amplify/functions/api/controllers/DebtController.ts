import { Request, Response } from 'express';
import { serviceFactory } from '../handler';
import { DebtPayoffService } from '@nueink/core';

/**
 * Debt Controller
 * Handles HTTP requests for debt operations
 */
class DebtController {
  /**
   * Get all debts for an organization
   * GET /debt/organization/:organizationId
   */
  public getByOrganization = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId } = req.params;

      if (!organizationId) {
        res.status(400).json({ error: 'organizationId is required' });
        return;
      }

      const debtService = serviceFactory.debt();
      const debts = await debtService.findByOrganization(organizationId);

      res.json({ debts, count: debts.length });
    } catch (error) {
      console.error('Error fetching debts:', error);
      res.status(500).json({
        error: 'Failed to fetch debts',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get active debts for an organization
   * GET /debt/active/:organizationId
   */
  public getActiveDebts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId } = req.params;

      if (!organizationId) {
        res.status(400).json({ error: 'organizationId is required' });
        return;
      }

      const debtService = serviceFactory.debt();
      const debts = await debtService.findActiveDebts(organizationId);

      res.json({ debts, count: debts.length });
    } catch (error) {
      console.error('Error fetching active debts:', error);
      res.status(500).json({
        error: 'Failed to fetch active debts',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get debt by ID
   * GET /debt/:debtId
   */
  public getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { debtId } = req.params;

      if (!debtId) {
        res.status(400).json({ error: 'debtId is required' });
        return;
      }

      const debtService = serviceFactory.debt();
      const debt = await debtService.findById(debtId);

      if (!debt) {
        res.status(404).json({ error: 'Debt not found' });
        return;
      }

      res.json(debt);
    } catch (error) {
      console.error('Error fetching debt:', error);
      res.status(500).json({
        error: 'Failed to fetch debt',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Create a new debt
   * POST /debt
   *
   * Body:
   * - organizationId: string (required)
   * - accountId: string (required)
   * - name: string (required)
   * - type: DebtType (required)
   * - originalBalance: number (required)
   * - currentBalance: number (required)
   * - interestRate?: number (optional)
   * - minimumPayment?: number (optional)
   * - dueDate?: number (optional)
   * - financialAccountId?: string (optional)
   */
  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        organizationId,
        accountId,
        name,
        type,
        originalBalance,
        currentBalance,
        interestRate,
        minimumPayment,
        dueDate,
        financialAccountId,
      } = req.body;

      // Validate required fields
      if (!organizationId || !accountId || !name || !type || originalBalance === undefined || currentBalance === undefined) {
        res.status(400).json({
          error: 'organizationId, accountId, name, type, originalBalance, and currentBalance are required'
        });
        return;
      }

      // TODO: Get profileOwner from Cognito auth context
      const profileOwner = accountId;

      const debt = {
        debtId: `debt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId,
        financialAccountId,
        name,
        type,
        originalBalance,
        currentBalance,
        interestRate,
        minimumPayment,
        dueDate,
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        profileOwner,
      };

      const debtService = serviceFactory.debt();
      const created = await debtService.create(debt);

      res.status(201).json(created);
    } catch (error) {
      console.error('Error creating debt:', error);
      res.status(500).json({
        error: 'Failed to create debt',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Update a debt
   * PUT /debt/:debtId
   */
  public update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { debtId } = req.params;
      const updates = req.body;

      if (!debtId) {
        res.status(400).json({ error: 'debtId is required' });
        return;
      }

      const debtService = serviceFactory.debt();
      const updated = await debtService.update(debtId, {
        ...updates,
        updatedAt: new Date(),
      });

      res.json(updated);
    } catch (error) {
      console.error('Error updating debt:', error);
      res.status(500).json({
        error: 'Failed to update debt',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Delete a debt
   * DELETE /debt/:debtId
   */
  public delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { debtId } = req.params;

      if (!debtId) {
        res.status(400).json({ error: 'debtId is required' });
        return;
      }

      const debtService = serviceFactory.debt();
      await debtService.delete(debtId);

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting debt:', error);
      res.status(500).json({
        error: 'Failed to delete debt',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Generate debt payoff plans
   * POST /debt/payoff-plans
   *
   * Body:
   * - organizationId: string (required)
   * - accountId: string (required)
   * - monthlyPayment?: number (optional) - defaults to minimums + 10%
   *
   * Returns multiple payoff strategies (avalanche, snowball)
   */
  public generatePayoffPlans = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId, accountId, monthlyPayment } = req.body;

      // Validate required fields
      if (!organizationId || !accountId) {
        res.status(400).json({
          error: 'organizationId and accountId are required'
        });
        return;
      }

      // TODO: Get profileOwner from Cognito auth context
      const profileOwner = accountId;

      // Get all active debts for the organization
      const debtService = serviceFactory.debt();
      const debts = await debtService.findActiveDebts(organizationId);

      if (debts.length === 0) {
        res.status(404).json({
          error: 'No active debts found',
          message: 'Add some debts before generating payoff plans'
        });
        return;
      }

      // Generate payoff plans
      const payoffService = new DebtPayoffService();
      const plans = payoffService.generatePayoffPlans(
        debts,
        organizationId,
        accountId,
        profileOwner,
        monthlyPayment
      );

      res.json({ plans, count: plans.length });
    } catch (error) {
      console.error('Error generating payoff plans:', error);
      res.status(500).json({
        error: 'Failed to generate payoff plans',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

export default new DebtController();
