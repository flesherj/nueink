import { Request, Response } from 'express';
import { serviceFactory } from '../handler';

/**
 * Analytics Controller
 * Handles HTTP requests for analytics and insights operations
 */
class AnalyticsController {
  /**
   * Get category spending timeline
   * GET /analytics/category-timeline/:organizationId/:category?startDate=...&endDate=...&highlightTransactionId=...&merchantName=...
   *
   * Query params:
   * - startDate (required): ISO date string for period start
   * - endDate (required): ISO date string for period end
   * - highlightTransactionId (optional): Transaction ID to highlight in timeline
   * - merchantName (optional): Merchant name to filter transactions (case-insensitive partial match)
   */
  public getCategoryTimeline = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId, category } = req.params;
      const { startDate, endDate, highlightTransactionId, merchantName } = req.query;

      // Validate required parameters
      if (!startDate || !endDate) {
        res.status(400).json({
          error: 'Missing required query parameters: startDate and endDate are required'
        });
        return;
      }

      // Parse dates
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json({
          error: 'Invalid date format. Use ISO 8601 format (e.g., 2025-11-01T00:00:00Z)'
        });
        return;
      }

      if (start > end) {
        res.status(400).json({
          error: 'startDate must be before or equal to endDate'
        });
        return;
      }

      const analyticsService = serviceFactory.analytics();

      const timeline = await analyticsService.getCategorySpendingTimeline(
        organizationId,
        category,
        start,
        end,
        highlightTransactionId as string | undefined,
        merchantName as string | undefined
      );

      res.json(timeline);
    } catch (error) {
      console.error('Error getting category timeline:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get category timeline'
      });
    }
  };

  /**
   * Get category spending summaries for a period
   * GET /analytics/category-summaries/:organizationId?startDate=...&endDate=...
   *
   * Query params:
   * - startDate (required): ISO date string for period start
   * - endDate (required): ISO date string for period end
   */
  public getCategorySummaries = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId } = req.params;
      const { startDate, endDate } = req.query;

      // Validate required parameters
      if (!startDate || !endDate) {
        res.status(400).json({
          error: 'Missing required query parameters: startDate and endDate are required'
        });
        return;
      }

      // Parse dates
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json({
          error: 'Invalid date format. Use ISO 8601 format (e.g., 2025-11-01T00:00:00Z)'
        });
        return;
      }

      if (start > end) {
        res.status(400).json({
          error: 'startDate must be before or equal to endDate'
        });
        return;
      }

      const analyticsService = serviceFactory.analytics();

      const summaries = await analyticsService.getCategorySpendingSummaries(
        organizationId,
        start,
        end
      );

      res.json(summaries);
    } catch (error) {
      console.error('Error getting category summaries:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get category summaries'
      });
    }
  };
}

export default new AnalyticsController();
