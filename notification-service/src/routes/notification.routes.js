import { Router } from 'express';
import { verifyAuthToken } from '../middleware/auth.js';
import { NotificationController } from '../controllers/notification.controller.js';

const router = Router();

// All notification routes require authentication
router.use(verifyAuthToken());

// Notification management routes
router.get('/notifications', NotificationController.getNotifications);
router.get('/notifications/unread-count', NotificationController.getUnreadCount);
router.get('/notifications/type/:type', NotificationController.getNotificationsByType);
router.get('/notifications/date-range', NotificationController.getNotificationsByDateRange);
router.get('/notifications/stats', NotificationController.getNotificationStats);

// Notification actions
router.put('/notifications/:notificationId/read', NotificationController.markAsRead);
router.put('/notifications/read-all', NotificationController.markAllAsRead);
router.delete('/notifications/:notificationId', NotificationController.deleteNotification);

// Notification settings
router.get('/settings', NotificationController.getNotificationSettings);
router.put('/settings', NotificationController.updateNotificationSettings);

export default router;
