import { getPool } from '../config/database.js';

export class PointsRedemptionModel {
  /**
   * Create a new points redemption
   */
  static async createRedemption(redemptionData) {
    const pool = getPool();
    const {
      userId,
      pointsAmount,
      redemptionType,
      description,
      referenceId
    } = redemptionData;

    const result = await pool.query(
      `INSERT INTO points_redemptions (
        user_id, points_amount, redemption_type, description, reference_id
      ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, pointsAmount, redemptionType, description, referenceId]
    );
    return result.rows[0];
  }

  /**
   * Get redemption by ID
   */
  static async getRedemptionById(redemptionId) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM points_redemptions WHERE id = $1',
      [redemptionId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get redemptions by user ID
   */
  static async getRedemptionsByUserId(userId, limit = 50, offset = 0, filters = {}) {
    const pool = getPool();
    let query = 'SELECT * FROM points_redemptions WHERE user_id = $1';
    let params = [userId];
    let paramCount = 1;

    if (filters.status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(filters.status);
    }

    if (filters.redemptionType) {
      paramCount++;
      query += ` AND redemption_type = $${paramCount}`;
      params.push(filters.redemptionType);
    }

    if (filters.startDate) {
      paramCount++;
      query += ` AND created_at >= $${paramCount}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      paramCount++;
      query += ` AND created_at <= $${paramCount}`;
      params.push(filters.endDate);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Update redemption status
   */
  static async updateRedemptionStatus(redemptionId, status, processedBy = null, processedAt = null) {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE points_redemptions 
       SET status = $2, processed_by = $3, processed_at = $4, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [redemptionId, status, processedBy, processedAt || new Date()]
    );
    return result.rows[0] || null;
  }

  /**
   * Get all redemptions with pagination
   */
  static async getAllRedemptions(limit = 50, offset = 0, filters = {}) {
    const pool = getPool();
    let query = 'SELECT * FROM points_redemptions';
    let params = [];
    let paramCount = 0;
    const conditions = [];

    if (filters.status) {
      paramCount++;
      conditions.push(`status = $${paramCount}`);
      params.push(filters.status);
    }

    if (filters.redemptionType) {
      paramCount++;
      conditions.push(`redemption_type = $${paramCount}`);
      params.push(filters.redemptionType);
    }

    if (filters.minAmount) {
      paramCount++;
      conditions.push(`points_amount >= $${paramCount}`);
      params.push(filters.minAmount);
    }

    if (filters.maxAmount) {
      paramCount++;
      conditions.push(`points_amount <= $${paramCount}`);
      params.push(filters.maxAmount);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get redemption statistics
   */
  static async getRedemptionStats(userId = null, startDate = null, endDate = null) {
    const pool = getPool();
    let query = `
      SELECT 
        redemption_type,
        status,
        COUNT(*) as count,
        SUM(points_amount) as total_points,
        AVG(points_amount) as avg_points,
        MIN(points_amount) as min_points,
        MAX(points_amount) as max_points
      FROM points_redemptions
    `;
    const params = [];
    let paramCount = 0;
    const conditions = [];

    if (userId) {
      paramCount++;
      conditions.push(`user_id = $${paramCount}`);
      params.push(userId);
    }

    if (startDate) {
      paramCount++;
      conditions.push(`created_at >= $${paramCount}`);
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      conditions.push(`created_at <= $${paramCount}`);
      params.push(endDate);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' GROUP BY redemption_type, status ORDER BY redemption_type, status';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get redemptions by status
   */
  static async getRedemptionsByStatus(status, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM points_redemptions 
       WHERE status = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );
    return result.rows;
  }

  /**
   * Get redemptions by type
   */
  static async getRedemptionsByType(redemptionType, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM points_redemptions 
       WHERE redemption_type = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [redemptionType, limit, offset]
    );
    return result.rows;
  }

  /**
   * Get pending redemptions
   */
  static async getPendingRedemptions(limit = 100) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM points_redemptions 
       WHERE status = 'pending' 
       ORDER BY created_at ASC 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Get redemptions by date range
   */
  static async getRedemptionsByDateRange(startDate, endDate, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM points_redemptions 
       WHERE created_at BETWEEN $1 AND $2
       ORDER BY created_at DESC 
       LIMIT $3 OFFSET $4`,
      [startDate, endDate, limit, offset]
    );
    return result.rows;
  }

  /**
   * Get daily redemption summary
   */
  static async getDailyRedemptionSummary(userId, startDate, endDate) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
         DATE(created_at) as date,
         COUNT(*) as redemption_count,
         SUM(points_amount) as total_points,
         AVG(points_amount) as avg_points,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
         COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count
       FROM points_redemptions 
       WHERE user_id = $1 
       AND created_at BETWEEN $2 AND $3
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [userId, startDate, endDate]
    );
    return result.rows;
  }

  /**
   * Get redemption trends
   */
  static async getRedemptionTrends(userId, days = 30) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
         DATE(created_at) as date,
         COUNT(*) as redemption_count,
         SUM(points_amount) as total_points,
         AVG(points_amount) as avg_points
       FROM points_redemptions 
       WHERE user_id = $1 
       AND created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Get redemption by reference ID
   */
  static async getRedemptionByReferenceId(referenceId) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM points_redemptions WHERE reference_id = $1',
      [referenceId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get total redemptions by user
   */
  static async getTotalRedemptionsByUser(userId) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
         SUM(points_amount) as total_redemptions,
         COUNT(*) as redemption_count,
         AVG(points_amount) as avg_redemption
       FROM points_redemptions 
       WHERE user_id = $1 AND status = 'completed'`,
      [userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get redemption leaderboard
   */
  static async getRedemptionLeaderboard(limit = 10) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
         user_id,
         COUNT(*) as redemption_count,
         SUM(points_amount) as total_redemptions,
         AVG(points_amount) as avg_redemption
       FROM points_redemptions 
       WHERE status = 'completed'
       GROUP BY user_id
       ORDER BY total_redemptions DESC 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Get redemption by redemption type
   */
  static async getRedemptionsByRedemptionType(redemptionType, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM points_redemptions 
       WHERE redemption_type = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [redemptionType, limit, offset]
    );
    return result.rows;
  }

  /**
   * Get redemption analytics
   */
  static async getRedemptionAnalytics(userId = null, startDate = null, endDate = null) {
    const pool = getPool();
    let query = `
      SELECT 
        DATE(created_at) as date,
        redemption_type,
        COUNT(*) as redemption_count,
        SUM(points_amount) as total_points,
        AVG(points_amount) as avg_points
      FROM points_redemptions
    `;
    const params = [];
    let paramCount = 0;
    const conditions = [];

    if (userId) {
      paramCount++;
      conditions.push(`user_id = $${paramCount}`);
      params.push(userId);
    }

    if (startDate) {
      paramCount++;
      conditions.push(`created_at >= $${paramCount}`);
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      conditions.push(`created_at <= $${paramCount}`);
      params.push(endDate);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` GROUP BY DATE(created_at), redemption_type ORDER BY date DESC, redemption_type`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Delete redemption (only if pending)
   */
  static async deleteRedemption(redemptionId, userId) {
    const pool = getPool();
    const result = await pool.query(
      `DELETE FROM points_redemptions 
       WHERE id = $1 AND user_id = $2 AND status = 'pending' 
       RETURNING *`,
      [redemptionId, userId]
    );
    return result.rows[0] || null;
  }
}
