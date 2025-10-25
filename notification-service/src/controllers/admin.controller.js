import { StatusCodes } from 'http-status-codes';
import { NotificationService } from '../services/notification.service.js';
import { ApiError } from '../middleware/error.js';
import { getPool } from '../config/database.js';

export class AdminController {
    /**
     * Send notification to all users
     */
    static async sendBulkNotification(req, res, next) {
        try {
            const { title, message, type = 'in_app' } = req.body;

            if (!title || !message) {
                throw new ApiError(StatusCodes.BAD_REQUEST, 'Title and message are required');
            }

            // Get all user IDs from database
            const pool = getPool();
            const result = await pool.query('SELECT id FROM users');
            const userIds = result.rows.map(row => row.id);

            if (userIds.length === 0) {
                throw new ApiError(StatusCodes.BAD_REQUEST, 'No users found');
            }

            // Send notifications to all users
            await NotificationService.sendBulkNotifications(
                userIds,
                type,
                title,
                message,
                { sentBy: req.user.id, sentAt: new Date() }
            );

            res.status(StatusCodes.OK).json({
                success: true,
                message: `Notification sent to ${userIds.length} users`,
                data: {
                    recipientsCount: userIds.length
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get total user count
     */
    static async getUserCount(req, res, next) {
        try {
            const pool = getPool();
            const result = await pool.query('SELECT COUNT(*) as count FROM users');
            const count = parseInt(result.rows[0].count);

            res.status(StatusCodes.OK).json({
                success: true,
                data: {
                    count
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get admin analytics - weekly notifications and engagement
     */
    static async getAnalytics(req, res, next) {
        try {
            const pool = getPool();

            // Get last 7 days of notification counts
            const weeklyResult = await pool.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM notifications
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `);

            // Get engagement metrics (opened, clicked, dismissed)
            const engagementResult = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as opened,
          COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END) as clicked,
          COUNT(CASE WHEN opened_at IS NULL AND clicked_at IS NULL THEN 1 END) as dismissed
        FROM notifications
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `);

            const engagement = engagementResult.rows[0];

            console.log('=== ANALYTICS DEBUG ===');
            console.log('Raw engagement data:', engagement);
            console.log('Total:', engagement.total);
            console.log('Opened:', engagement.opened);
            console.log('Clicked:', engagement.clicked);
            console.log('Dismissed:', engagement.dismissed);
            console.log('======================');

            res.status(StatusCodes.OK).json({
                success: true,
                data: {
                    weekly: weeklyResult.rows,
                    engagement: {
                        total: parseInt(engagement.total),
                        opened: parseInt(engagement.opened),
                        clicked: parseInt(engagement.clicked),
                        dismissed: parseInt(engagement.dismissed)
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }
}
