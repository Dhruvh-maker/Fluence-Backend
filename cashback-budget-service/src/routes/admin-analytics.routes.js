import { Router } from 'express';
import { verifyAuthToken } from '../middleware/auth.js';
import { AdminAnalyticsController } from '../controllers/admin-analytics.controller.js';
import { query } from 'express-validator';

const router = Router();

// All admin routes require authentication
router.use(verifyAuthToken());

// Validation middleware
const analyticsQueryValidation = [
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  query('groupBy').optional().isIn(['hour', 'day', 'week', 'month']).withMessage('Group by must be hour, day, week, or month'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  query('merchantId').optional().isUUID().withMessage('Invalid merchant ID'),
  query('errorType').optional().isString().withMessage('Error type must be a string'),
  query('hoursLate').optional().isInt({ min: 1, max: 168 }).withMessage('Hours late must be between 1 and 168')
];

// Platform analytics routes
router.get('/platform/transactions', analyticsQueryValidation, AdminAnalyticsController.getPlatformTransactionAnalytics);
router.get('/platform/health', AdminAnalyticsController.getPlatformHealthMetrics);
router.get('/platform/trends', analyticsQueryValidation, AdminAnalyticsController.getTransactionTrends);
router.get('/platform/dashboard', analyticsQueryValidation, AdminAnalyticsController.getAdminDashboardMetrics);

// Merchant analytics routes
router.get('/merchants/performance', analyticsQueryValidation, AdminAnalyticsController.getMerchantPerformanceAnalytics);
router.get('/merchants/settlements', analyticsQueryValidation, AdminAnalyticsController.getPaymentSettlementAnalytics);

// Transaction analytics routes
router.get('/transactions/errors', analyticsQueryValidation, AdminAnalyticsController.getTransactionErrorAnalytics);
router.get('/transactions/failed-payments', analyticsQueryValidation, AdminAnalyticsController.getFailedPaymentNotifications);
router.get('/transactions/late-payments', analyticsQueryValidation, AdminAnalyticsController.getLatePaymentNotifications);

export default router;
