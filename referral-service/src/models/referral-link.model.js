import { getPool } from '../config/database.js';

export class ReferralLinkModel {
  /**
   * Create a new referral link
   */
  static async createReferralLink(referrerId, referralCode) {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO referral_links (referrer_id, referral_code, status) 
       VALUES ($1, $2, $3) RETURNING *`,
      [referrerId, referralCode, 'active']
    );
    return result.rows[0];
  }

  /**
   * Get referral link by code
   */
  static async getReferralLinkByCode(referralCode) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM referral_links WHERE referral_code = $1 AND status = $2',
      [referralCode, 'active']
    );
    return result.rows[0] || null;
  }

  /**
   * Get referral links by referrer
   */
  static async getReferralLinksByReferrer(referrerId, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM referral_links 
       WHERE referrer_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [referrerId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Update referral link status
   */
  static async updateReferralLinkStatus(referralLinkId, status, referredUserId = null) {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE referral_links 
       SET status = $2, referred_user_id = $3, completed_at = $4, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [referralLinkId, status, referredUserId, status === 'completed' ? new Date() : null]
    );
    return result.rows[0] || null;
  }

  /**
   * Get referral link by ID
   */
  static async getReferralLinkById(referralLinkId) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM referral_links WHERE id = $1',
      [referralLinkId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get referral statistics
   */
  static async getReferralStats(referrerId) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
         COUNT(*) as total_referrals,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_referrals,
         SUM(CASE WHEN status = 'completed' THEN points_awarded ELSE 0 END) as total_points_earned
       FROM referral_links 
       WHERE referrer_id = $1`,
      [referrerId]
    );
    return result.rows[0] || null;
  }

  /**
   * Check if user has active referral link
   */
  static async hasActiveReferralLink(referrerId) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT id FROM referral_links WHERE referrer_id = $1 AND status = $2 LIMIT 1',
      [referrerId, 'active']
    );
    return result.rows.length > 0;
  }

  /**
   * Get referral leaderboard
   */
  static async getReferralLeaderboard(limit = 10) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
         referrer_id,
         COUNT(*) as total_referrals,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_referrals,
         SUM(CASE WHEN status = 'completed' THEN points_awarded ELSE 0 END) as total_points_earned
       FROM referral_links 
       GROUP BY referrer_id
       ORDER BY successful_referrals DESC, total_points_earned DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }
}
