import { StatusCodes } from 'http-status-codes';
import { NotificationService } from '../services/notification.service.js';
import { ApiError } from '../middleware/error.js';

export class NotificationController {
  /**
   * Get user's notifications
   */
  static async getNotifications(req, res, next) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const notifications = await NotificationService.getUserNotifications(userId, limit, offset);
      const unreadCount = await NotificationService.getUnreadCount(userId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          notifications,
          unreadCount,
          pagination: {
            limit,
            offset,
            hasMore: notifications.length === limit
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;

      const notification = await NotificationService.markAsRead(notificationId, userId);

      if (!notification) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found');
      }

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Notification marked as read',
        data: notification
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.id;

      const notifications = await NotificationService.markAllAsRead(userId);

      res.status(StatusCodes.OK).json({
        success: true,
        message: `${notifications.length} notifications marked as read`,
        data: { count: notifications.length }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.id;

      const count = await NotificationService.getUnreadCount(userId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: { unreadCount: count }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get notifications by type
   */
  static async getNotificationsByType(req, res, next) {
    try {
      const userId = req.user.id;
      const { type } = req.params;
      const limit = parseInt(req.query.limit) || 20;

      const validTypes = ['social_post_reminder', 'points_available', 'points_expiring'];
      if (!validTypes.includes(type)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid notification type');
      }

      const notifications = await NotificationService.getNotificationsByType(userId, type, limit);

      res.status(StatusCodes.OK).json({
        success: true,
        data: notifications
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get notification statistics
   */
  static async getNotificationStats(req, res, next) {
    try {
      const userId = req.user.id;

      const stats = await NotificationService.getNotificationStats(userId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get notification settings
   */
  static async getNotificationSettings(req, res, next) {
    try {
      const userId = req.user.id;

      const settings = await NotificationService.getNotificationSettings(userId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: settings
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update notification settings
   */
  static async updateNotificationSettings(req, res, next) {
    try {
      const userId = req.user.id;
      const { socialPostReminders, pointsAvailable, pointsExpiring } = req.body;

      const settings = await NotificationService.updateNotificationSettings(userId, {
        socialPostReminders,
        pointsAvailable,
        pointsExpiring
      });

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Notification settings updated successfully',
        data: settings
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(req, res, next) {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;

      const notification = await NotificationService.deleteNotification(notificationId, userId);

      if (!notification) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found');
      }

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Notification deleted successfully',
        data: notification
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get notifications by date range
   */
  static async getNotificationsByDateRange(req, res, next) {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      if (!startDate || !endDate) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Start date and end date are required');
      }

      const notifications = await NotificationService.getNotificationsByDateRange(
        userId, startDate, endDate, limit, offset
      );

      res.status(StatusCodes.OK).json({
        success: true,
        data: notifications,
        pagination: {
          limit,
          offset,
          count: notifications.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
