import { Router } from 'express';
import AnalyticsController from '../controllers/AnalyticsController';

const router = Router();

// GET /analytics/category-timeline/:organizationId/:category - Get spending timeline for a category
router.get('/category-timeline/:organizationId/:category', AnalyticsController.getCategoryTimeline);

// GET /analytics/category-summaries/:organizationId - Get spending summaries for all categories
router.get('/category-summaries/:organizationId', AnalyticsController.getCategorySummaries);

export default router;
