import { StatusCodes } from 'http-status-codes';
import { getPool } from '../config/database.js';
import { ApiError } from '../middleware/error.js';

export class ReferralController {
  /**
   * Generate referral code for user
   */
  static async generateReferralCode(req, res, next) {
    try {
      const userId = req.user.id;
      const pool = getPool();
      
      // Check if user already has a referral code
      const existingCode = await pool.query(
        'SELECT referral_code FROM referral_links WHERE referrer_id = $1 AND status = $2',
        [userId, 'active']
      );
      
      if (existingCode.rows.length > 0) {
        return res.status(StatusCodes.OK).json({
          success: true,
          data: {
            referralCode: existingCode.rows[0].referral_code,
            isNew: false
          },
          message: 'Referral code already exists'
        });
      }
      
      // Generate new referral code
      const result = await pool.query('SELECT generate_referral_code() as code');
      const referralCode = result.rows[0].code;
      
      // Create referral link
      const referralLink = await pool.query(
        `INSERT INTO referral_links (referrer_id, referral_code, status) 
         VALUES ($1, $2, $3) RETURNING *`,
        [userId, referralCode, 'active']
      );
      
      res.status(StatusCodes.CREATED).json({
        success: true,
        data: {
          referralCode: referralLink.rows[0].referral_code,
          isNew: true
        },
        message: 'Referral code generated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate referral code
   */
  static async validateReferralCode(req, res, next) {
    try {
      const { referralCode } = req.body;
      
      if (!referralCode) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Referral code is required');
      }
      
      const pool = getPool();
      const result = await pool.query(
        'SELECT * FROM referral_links WHERE referral_code = $1 AND status = $2',
        [referralCode, 'active']
      );
      
      if (result.rows.length === 0) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Invalid referral code');
      }
      
      const referralLink = result.rows[0];
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          isValid: true,
          referrerId: referralLink.referrer_id,
          referralCode: referralLink.referral_code,
          createdAt: referralLink.created_at
        },
        message: 'Referral code is valid'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's referral statistics
   */
  static async getReferralStats(req, res, next) {
    try {
      const userId = req.user.id;
      const pool = getPool();
      
      const stats = await pool.query(
        'SELECT * FROM referral_statistics WHERE user_id = $1',
        [userId]
      );
      
      if (stats.rows.length === 0) {
        // Create default stats if none exist
        await pool.query(
          'INSERT INTO referral_statistics (user_id) VALUES ($1)',
          [userId]
        );
        
        const newStats = await pool.query(
          'SELECT * FROM referral_statistics WHERE user_id = $1',
          [userId]
        );
        
        return res.status(StatusCodes.OK).json({
          success: true,
          data: newStats.rows[0]
        });
      }
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: stats.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get referral leaderboard
   */
  static async getReferralLeaderboard(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const pool = getPool();
      
      const leaderboard = await pool.query(
        `SELECT 
           user_id,
           total_referrals,
           total_points_earned,
           rank_position
         FROM referral_leaderboard 
         ORDER BY rank_position ASC 
         LIMIT $1`,
        [parseInt(limit)]
      );
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: leaderboard.rows,
        pagination: {
          limit: parseInt(limit),
          count: leaderboard.rows.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's referral rewards
   */
  static async getReferralRewards(req, res, next) {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0 } = req.query;
      const pool = getPool();
      
      const rewards = await pool.query(
        `SELECT * FROM referral_rewards 
         WHERE referrer_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, parseInt(limit), parseInt(offset)]
      );
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: rewards.rows,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          count: rewards.rows.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get referral campaigns
   */
  static async getReferralCampaigns(req, res, next) {
    try {
      const pool = getPool();
      
      const campaigns = await pool.query(
        `SELECT * FROM referral_campaigns 
         WHERE is_active = true 
         AND (end_date IS NULL OR end_date > NOW())
         ORDER BY created_at DESC`
      );
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: campaigns.rows
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get referral analytics
   */
  static async getReferralAnalytics(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const pool = getPool();
      
      let query = 'SELECT * FROM referral_analytics';
      let params = [];
      let paramCount = 0;
      
      if (startDate && endDate) {
        paramCount++;
        query += ` WHERE date BETWEEN $${paramCount} AND $${paramCount + 1}`;
        params.push(startDate, endDate);
      }
      
      query += ' ORDER BY date DESC';
      
      const analytics = await pool.query(query, params);
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: analytics.rows
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's referral links
   */
  static async getReferralLinks(req, res, next) {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0 } = req.query;
      const pool = getPool();
      
      const links = await pool.query(
        `SELECT * FROM referral_links 
         WHERE referrer_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, parseInt(limit), parseInt(offset)]
      );
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: links.rows,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          count: links.rows.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Complete referral (when referred user signs up)
   */
  static async completeReferral(req, res, next) {
    try {
      const { referralCode, referredUserId } = req.body;
      
      if (!referralCode || !referredUserId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Referral code and referred user ID are required');
      }
      
      const pool = getPool();
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Find the referral link
        const referralLink = await client.query(
          'SELECT * FROM referral_links WHERE referral_code = $1 AND status = $2 FOR UPDATE',
          [referralCode, 'active']
        );
        
        if (referralLink.rows.length === 0) {
          throw new ApiError(StatusCodes.NOT_FOUND, 'Invalid referral code');
        }
        
        const link = referralLink.rows[0];
        
        // Check if user is trying to refer themselves
        if (link.referrer_id === referredUserId) {
          throw new ApiError(StatusCodes.BAD_REQUEST, 'Cannot refer yourself');
        }
        
        // Update referral link
        await client.query(
          `UPDATE referral_links 
           SET referred_user_id = $2, status = $3, completed_at = NOW()
           WHERE id = $1`,
          [link.id, referredUserId, 'completed']
        );
        
        // Create referral reward
        await client.query(
          `INSERT INTO referral_rewards (
            referrer_id, referred_user_id, referral_link_id, 
            reward_type, points_amount, status
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            link.referrer_id, 
            referredUserId, 
            link.id, 
            'signup', 
            100, // Default signup reward
            'pending'
          ]
        );
        
        await client.query('COMMIT');
        
        res.status(StatusCodes.OK).json({
          success: true,
          message: 'Referral completed successfully'
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      next(error);
    }
  }
}
