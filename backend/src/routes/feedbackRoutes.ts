import { Router } from 'express';
import {
  getMetricsOverview,
  getSentimentDistribution,
  getSentimentTrends,
  getTopics,
  getInsights,
  handleNLQ, // Import the new NLQ handler
} from '../controllers/feedbackController';

const router = Router();

// Existing routes
router.get('/metrics-overview', getMetricsOverview);
router.get('/sentiment-distribution', getSentimentDistribution);
router.get('/sentiment-trends', getSentimentTrends);
router.get('/topics', getTopics);
router.get('/insights', getInsights);

// New NLQ route
router.post('/nlq', handleNLQ);

export default router;
