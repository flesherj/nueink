import { Request, Response } from 'express';
import { serviceFactory, awsFactory } from '../handler';
import { BedrockAIInsightProvider } from '@nueink/aws/services';

/**
 * Budget Controller
 * Handles HTTP requests for budget operations
 */
class BudgetController {
  /**
   * Create a baseline budget from financial analysis
   * POST /budget/from-analysis
   *
   * Body:
   * - organizationId: string (required)
   * - accountId: string (required)
   * - periodMonths: number (optional, default: 3) - months to analyze
   * - budgetName: string (optional) - custom budget name
   */
  public createFromAnalysis = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId, accountId, periodMonths, budgetName } = req.body;

      // Validate required fields
      if (!organizationId || !accountId) {
        res.status(400).json({
          error: 'organizationId and accountId are required'
        });
        return;
      }

      // Parse period
      const months = periodMonths ? parseInt(periodMonths as string, 10) : 3;

      // Validate period
      if (isNaN(months) || months < 1 || months > 12) {
        res.status(400).json({
          error: 'periodMonths must be a number between 1 and 12'
        });
        return;
      }

      // TODO: Get profileOwner from Cognito auth context
      // For now, using accountId as profileOwner (should be cognito user ID)
      const profileOwner = accountId;

      // Step 1: Run financial analysis
      const aiProvider = new BedrockAIInsightProvider(awsFactory.bedrock());
      const analysisService = serviceFactory.financialAnalysis(aiProvider);

      const analysis = await analysisService.analyzeSpending(
        organizationId,
        accountId,
        profileOwner,
        months
      );

      // Step 2: Create baseline budget from analysis
      const budgetService = serviceFactory.budget();
      const budget = await budgetService.createBaselineFromAnalysis(analysis, budgetName);

      // Return created budget with analysis data
      res.status(201).json({
        budget,
        analysis: {
          analysisId: analysis.analysisId,
          periodStart: analysis.periodStart,
          periodEnd: analysis.periodEnd,
          totalSpending: analysis.totalSpending,
          categoryCount: analysis.spendingByCategory.length,
        }
      });
    } catch (error) {
      console.error('Error creating baseline budget:', error);
      res.status(500).json({
        error: 'Failed to create baseline budget',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get active budget for an organization
   * GET /budget/active/:organizationId
   */
  public getActiveBudget = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId } = req.params;

      if (!organizationId) {
        res.status(400).json({ error: 'organizationId is required' });
        return;
      }

      const budgetService = serviceFactory.budget();
      const budget = await budgetService.findActiveBudget(organizationId);

      if (!budget) {
        res.status(404).json({ error: 'No active budget found' });
        return;
      }

      res.json(budget);
    } catch (error) {
      console.error('Error fetching active budget:', error);
      res.status(500).json({
        error: 'Failed to fetch active budget',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get all budgets for an organization
   * GET /budget/organization/:organizationId
   */
  public getBudgetsByOrganization = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId } = req.params;

      if (!organizationId) {
        res.status(400).json({ error: 'organizationId is required' });
        return;
      }

      const budgetService = serviceFactory.budget();
      const budgets = await budgetService.findByOrganization(organizationId);

      res.json({ budgets, count: budgets.length });
    } catch (error) {
      console.error('Error fetching budgets:', error);
      res.status(500).json({
        error: 'Failed to fetch budgets',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get budget by ID
   * GET /budget/:budgetId
   */
  public getBudgetById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { budgetId } = req.params;

      if (!budgetId) {
        res.status(400).json({ error: 'budgetId is required' });
        return;
      }

      const budgetService = serviceFactory.budget();
      const budget = await budgetService.findById(budgetId);

      if (!budget) {
        res.status(404).json({ error: 'Budget not found' });
        return;
      }

      res.json(budget);
    } catch (error) {
      console.error('Error fetching budget:', error);
      res.status(500).json({
        error: 'Failed to fetch budget',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

export default new BudgetController();
