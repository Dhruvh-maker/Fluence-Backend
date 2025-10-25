import { Router } from 'express';
import { verifyAuthToken, requireAdmin } from '../middleware/auth.js';
import { AdminController } from '../controllers/admin.controller.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(verifyAuthToken());
router.use(requireAdmin());

// Send notification to all users
router.post('/send', AdminController.sendBulkNotification);

// Get user count
router.get('/user-count', AdminController.getUserCount);

// Get analytics
router.get('/analytics', AdminController.getAnalytics);

export default router;
