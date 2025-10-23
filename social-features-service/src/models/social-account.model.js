import { getPool } from '../config/database.js';

export class SocialAccountModel {
  /**
   * Create a new social account
   */
  static async createSocialAccount(accountData) {
    const pool = getPool();
    const {
      userId,
      platformId,
      platformUserId,
      username,
      displayName,
      profilePictureUrl,
      accessToken,
      refreshToken,
      tokenExpiresAt
    } = accountData;

    const result = await pool.query(
      `INSERT INTO social_accounts (
        user_id, platform_id, platform_user_id, username, display_name,
        profile_picture_url, access_token, refresh_token, token_expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [userId, platformId, platformUserId, username, displayName, profilePictureUrl, accessToken, refreshToken, tokenExpiresAt]
    );
    return result.rows[0];
  }

  /**
   * Get social accounts by user
   */
  static async getSocialAccountsByUser(userId) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT sa.*, sp.name as platform_name, sp.display_name as platform_display_name
       FROM social_accounts sa
       JOIN social_platforms sp ON sa.platform_id = sp.id
       WHERE sa.user_id = $1 AND sa.is_connected = true
       ORDER BY sa.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Get social account by ID
   */
  static async getSocialAccountById(accountId) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM social_accounts WHERE id = $1',
      [accountId]
    );
    return result.rows[0] || null;
  }

  /**
   * Update social account
   */
  static async updateSocialAccount(accountId, updateData) {
    const pool = getPool();
    const {
      username,
      displayName,
      profilePictureUrl,
      accessToken,
      refreshToken,
      tokenExpiresAt,
      isConnected
    } = updateData;

    const result = await pool.query(
      `UPDATE social_accounts 
       SET username = $2, display_name = $3, profile_picture_url = $4,
           access_token = $5, refresh_token = $6, token_expires_at = $7,
           is_connected = $8, last_sync_at = NOW(), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [accountId, username, displayName, profilePictureUrl, accessToken, refreshToken, tokenExpiresAt, isConnected]
    );
    return result.rows[0] || null;
  }

  /**
   * Disconnect social account
   */
  static async disconnectSocialAccount(accountId, userId) {
    const pool = getPool();
    const result = await pool.query(
      'UPDATE social_accounts SET is_connected = false, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
      [accountId, userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get social account by platform and user
   */
  static async getSocialAccountByPlatform(userId, platformId) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM social_accounts WHERE user_id = $1 AND platform_id = $2 AND is_connected = true',
      [userId, platformId]
    );
    return result.rows[0] || null;
  }

  /**
   * Check if social account exists
   */
  static async socialAccountExists(userId, platformId) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT id FROM social_accounts WHERE user_id = $1 AND platform_id = $2 AND is_connected = true LIMIT 1',
      [userId, platformId]
    );
    return result.rows.length > 0;
  }

  /**
   * Get social account statistics
   */
  static async getSocialAccountStats(userId) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
         COUNT(*) as total_accounts,
         COUNT(CASE WHEN is_connected = true THEN 1 END) as connected_accounts,
         COUNT(CASE WHEN is_connected = false THEN 1 END) as disconnected_accounts
       FROM social_accounts 
       WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  }
}
