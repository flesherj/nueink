import { Request, Response } from 'express';
import { serviceFactory, awsFactory } from '../handler';
import { BedrockAIInsightProvider } from '@nueink/aws/services';

/**
 * Financial Analysis Controller
 * Handles HTTP requests for financial analysis operations
 */
class FinancialAnalysisController {
  /**
   * Analyze spending for an organization with monthly averages
   * GET /financial-analysis/analyze/:organizationId/:accountId?periodMonths=12
   *
   * Query params:
   * - periodMonths (optional): Number of months to analyze (default: 12, max: 12)
   *
   * Returns analysis with monthly average spending across categories
   */
  public analyzeSpending = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId, accountId } = req.params;
      const { periodMonths } = req.query;

      // Parse period - default to 12 months for optimal financial planning
      const months = periodMonths ? parseInt(periodMonths as string, 10) : 12;

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

      // Create Bedrock AI provider and inject into service
      const aiProvider = new BedrockAIInsightProvider(awsFactory.bedrock());
      const analysisService = serviceFactory.financialAnalysis(aiProvider);

      const analysis = await analysisService.analyzeSpending(
        organizationId,
        accountId,
        profileOwner,
        months
      );

      // Generate AI-powered insights
      const insights = await analysisService.generateAIInsights(analysis);

      // Return analysis with AI insights
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
