import { Request, Response } from 'express';
import { serviceFactory } from '../handler';

/**
 * Financial Analysis Controller
 * Handles HTTP requests for financial analysis operations
 */
class FinancialAnalysisController {
  /**
   * Analyze spending for an organization
   * GET /financial-analysis/analyze/:organizationId/:accountId?periodMonths=3
   *
   * Query params:
   * - periodMonths (optional): Number of months to analyze (default: 3)
   */
  public analyzeSpending = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId, accountId } = req.params;
      const { periodMonths } = req.query;

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

      const analysisService = serviceFactory.financialAnalysis();

      const analysis = await analysisService.analyzeSpending(
        organizationId,
        accountId,
        profileOwner,
        months
      );

      // Get simple insights
      const insights = analysisService.getSimpleInsights(analysis);

      // Return analysis with insights
      res.json({
        ...analysis,
        insights
      });
    } catch (error) {
      console.error('Error analyzing spending:', error);
      res.status(500).json({
        error: 'Failed to analyze spending',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

export default new FinancialAnalysisController();
