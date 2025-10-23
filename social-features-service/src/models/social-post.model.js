import { getPool } from '../config/database.js';

export class SocialPostModel {
  /**
   * Create a new social post
   */
  static async createSocialPost(postData) {
    const pool = getPool();
    const {
      userId,
      socialAccountId,
      content,
      mediaUrls,
      postType,
      scheduledAt
    } = postData;

    const result = await pool.query(
      `INSERT INTO social_posts (
        user_id, social_account_id, content, media_urls, post_type, scheduled_at
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, socialAccountId, content, mediaUrls || [], postType || 'text', scheduledAt]
    );
    return result.rows[0];
  }

  /**
   * Get social posts by user
   */
  static async getSocialPostsByUser(userId, limit = 50, offset = 0, filters = {}) {
    const pool = getPool();
    let query = `
      SELECT sp.*, sa.platform_user_id, sa.username, sa.display_name, 
             pl.name as platform_name, pl.display_name as platform_display_name
      FROM social_posts sp
      JOIN social_accounts sa ON sp.social_account_id = sa.id
      JOIN social_platforms pl ON sa.platform_id = pl.id
      WHERE sp.user_id = $1
    `;
    let params = [userId];
    let paramCount = 1;

    if (filters.status) {
      paramCount++;
      query += ` AND sp.status = $${paramCount}`;
      params.push(filters.status);
    }

    if (filters.postType) {
      paramCount++;
      query += ` AND sp.post_type = $${paramCount}`;
      params.push(filters.postType);
    }

    query += ` ORDER BY sp.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get social post by ID
   */
  static async getSocialPostById(postId) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM social_posts WHERE id = $1',
      [postId]
    );
    return result.rows[0] || null;
  }

  /**
   * Update social post
   */
  static async updateSocialPost(postId, updateData) {
    const pool = getPool();
    const {
      content,
      mediaUrls,
      postType,
      status
    } = updateData;

    const result = await pool.query(
      `UPDATE social_posts 
       SET content = $2, media_urls = $3, post_type = $4, status = $5, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [postId, content, mediaUrls, postType, status]
    );
    return result.rows[0] || null;
  }

  /**
   * Delete social post
   */
  static async deleteSocialPost(postId, userId) {
    const pool = getPool();
    const result = await pool.query(
      'UPDATE social_posts SET status = $3, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
      [postId, userId, 'deleted']
    );
    return result.rows[0] || null;
  }

  /**
   * Get social posts by status
   */
  static async getSocialPostsByStatus(status, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM social_posts 
       WHERE status = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );
    return result.rows;
  }

  /**
   * Get social posts by type
   */
  static async getSocialPostsByType(postType, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM social_posts 
       WHERE post_type = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [postType, limit, offset]
    );
    return result.rows;
  }

  /**
   * Get social post statistics
   */
  static async getSocialPostStats(userId) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
         COUNT(*) as total_posts,
         COUNT(CASE WHEN status = 'published' THEN 1 END) as published_posts,
         COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_posts,
         COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_posts,
         SUM(likes_count) as total_likes,
         SUM(shares_count) as total_shares,
         SUM(comments_count) as total_comments
       FROM social_posts 
       WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get social posts requiring verification
   */
  static async getSocialPostsRequiringVerification(limit = 50) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT sp.*, sa.username, sa.display_name, pl.name as platform_name
       FROM social_posts sp
       JOIN social_accounts sa ON sp.social_account_id = sa.id
       JOIN social_platforms pl ON sa.platform_id = pl.id
       WHERE sp.status = 'published' 
       AND sp.social_post_verified = false
       ORDER BY sp.published_at ASC 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Update social post engagement
   */
  static async updateSocialPostEngagement(postId, engagementData) {
    const pool = getPool();
    const {
      likesCount,
      sharesCount,
      commentsCount
    } = engagementData;

    const result = await pool.query(
      `UPDATE social_posts 
       SET likes_count = $2, shares_count = $3, comments_count = $4, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [postId, likesCount, sharesCount, commentsCount]
    );
    return result.rows[0] || null;
  }
}
