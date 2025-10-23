import { Router } from 'express';
import { verifyAuthToken } from '../middleware/auth.js';
import { AdminSocialController } from '../controllers/admin-social.controller.js';
import { body, param, query } from 'express-validator';

const router = Router();

// All admin routes require authentication
router.use(verifyAuthToken());

// Validation middleware
const postIdValidation = [
  param('postId').isUUID().withMessage('Invalid post ID')
];

const userIdValidation = [
  param('userId').isUUID().withMessage('Invalid user ID')
];

const approvePostValidation = [
  param('postId').isUUID().withMessage('Invalid post ID'),
  body('adminNotes').optional().isString().withMessage('Admin notes must be a string')
];

const rejectPostValidation = [
  param('postId').isUUID().withMessage('Invalid post ID'),
  body('rejectionReason').notEmpty().withMessage('Rejection reason is required'),
  body('adminNotes').optional().isString().withMessage('Admin notes must be a string')
];

const dailyLimitValidation = [
  param('userId').isUUID().withMessage('Invalid user ID'),
  body('dailyLimit').optional().isInt({ min: 1, max: 50 }).withMessage('Daily limit must be between 1 and 50')
];

const queryValidation = [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  query('platformId').optional().isUUID().withMessage('Invalid platform ID'),
  query('status').optional().isIn(['pending_review', 'approved', 'rejected', 'published']).withMessage('Invalid status'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date')
];

// Admin post management routes
router.get('/posts/pending', queryValidation, AdminSocialController.getPendingPosts);
router.get('/posts/:postId', postIdValidation, AdminSocialController.getPostForReview);
router.post('/posts/:postId/approve', approvePostValidation, AdminSocialController.approvePost);
router.post('/posts/:postId/reject', rejectPostValidation, AdminSocialController.rejectPost);

// Post validation routes
router.get('/posts/:postId/validate', postIdValidation, AdminSocialController.validatePostMetadata);
router.get('/posts/:postId/duplicates', postIdValidation, AdminSocialController.checkDuplicatePosts);

// Admin dashboard routes
router.get('/posts/attention', AdminSocialController.getPostsRequiringAttention);
router.get('/posts/stats', queryValidation, AdminSocialController.getPostReviewStats);

// Post limits enforcement
router.get('/users/:userId/limits', userIdValidation, AdminSocialController.enforceDailyPostLimits);
router.post('/users/:userId/limits', dailyLimitValidation, AdminSocialController.enforceDailyPostLimits);

export default router;
