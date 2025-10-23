import { getPool } from '../config/database.js';

export class ReferralRewardModel {
  /**
   * Create a new referral reward
   */
  static async createReferralReward(rewardData) {
    const pool = getPool();
    const {
      referrerId,
      referredUserId,
      referralLinkId,
      rewardType,
      pointsAmount,
      description
    } = rewardData;

    const result = await pool.query(
      `INSERT INTO referral_rewards (
        referrer_id, referred_user_id, referral_link_id, 
        reward_type, points_amount, description, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [referrerId, referredUserId, referralLinkId, rewardType, pointsAmount, description, 'pending']
    );
    return result.rows[0];
  }

  /**
   * Get referral rewards by referrer
   */
  static async getReferralRewardsByReferrer(referrerId, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM referral_rewards 
       WHERE referrer_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [referrerId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Update referral reward status
   */
  static async updateReferralRewardStatus(rewardId, status, awardedAt = null) {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE referral_rewards 
       SET status = $2, awarded_at = $3, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [rewardId, status, awardedAt || new Date()]
    );
    return result.rows[0] || null;
  }

  /**
   * Get referral reward by ID
   */
  static async getReferralRewardById(rewardId) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM referral_rewards WHERE id = $1',
      [rewardId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get referral rewards by type
   */
  static async getReferralRewardsByType(rewardType, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM referral_rewards 
       WHERE reward_type = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [rewardType, limit, offset]
    );
    return result.rows;
  }

  /**
   * Get pending referral rewards
   */
  static async getPendingReferralRewards(limit = 100) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM referral_rewards 
       WHERE status = 'pending' 
       ORDER BY created_at ASC 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Get referral reward statistics
   */
  static async getReferralRewardStats(referrerId) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
         COUNT(*) as total_rewards,
         SUM(points_amount) as total_points,
         COUNT(CASE WHEN status = 'awarded' THEN 1 END) as awarded_rewards,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_rewards
       FROM referral_rewards 
       WHERE referrer_id = $1`,
      [referrerId]
    );
    return result.rows[0] || null;
  }
}
