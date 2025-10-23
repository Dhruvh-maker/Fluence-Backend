import { getPool } from '../config/database.js';

export class DisputeModel {
  /**
   * Create a new dispute
   */
  static async createDispute(disputeData) {
    const pool = getPool();
    const {
      merchantId,
      transactionId,
      disputeType,
      title,
      description,
      priority = 'medium'
    } = disputeData;

    const result = await pool.query(
      `INSERT INTO disputes (
        merchant_id, transaction_id, dispute_type, title, description, priority
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [merchantId, transactionId, disputeType, title, description, priority]
    );
    return result.rows[0];
  }

  /**
   * Get dispute by ID
   */
  static async getDisputeById(disputeId) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM disputes WHERE id = $1',
      [disputeId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get disputes by merchant ID
   */
  static async getDisputesByMerchantId(merchantId, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM disputes 
       WHERE merchant_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [merchantId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Get all disputes with pagination
   */
  static async getAllDisputes(limit = 50, offset = 0, status = null, priority = null) {
    const pool = getPool();
    let query = 'SELECT * FROM disputes';
    let params = [];
    let paramCount = 0;
    const conditions = [];

    if (status) {
      paramCount++;
      conditions.push(`status = $${paramCount}`);
      params.push(status);
    }

    if (priority) {
      paramCount++;
      conditions.push(`priority = $${paramCount}`);
      params.push(priority);
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
   * Update dispute status
   */
  static async updateDisputeStatus(disputeId, status, resolutionNotes = null, assignedTo = null) {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE disputes 
       SET status = $2, resolution_notes = $3, assigned_to = $4, 
           resolved_at = CASE WHEN $2 IN ('resolved', 'rejected') THEN NOW() ELSE resolved_at END,
           updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [disputeId, status, resolutionNotes, assignedTo]
    );
    return result.rows[0] || null;
  }

  /**
   * Assign dispute to admin
   */
  static async assignDispute(disputeId, assignedTo) {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE disputes 
       SET assigned_to = $2, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [disputeId, assignedTo]
    );
    return result.rows[0] || null;
  }

  /**
   * Get disputes by status
   */
  static async getDisputesByStatus(status, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM disputes 
       WHERE status = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );
    return result.rows;
  }

  /**
   * Get disputes by priority
   */
  static async getDisputesByPriority(priority, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM disputes 
       WHERE priority = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [priority, limit, offset]
    );
    return result.rows;
  }

  /**
   * Get disputes assigned to admin
   */
  static async getDisputesByAssignedAdmin(assignedTo, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM disputes 
       WHERE assigned_to = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [assignedTo, limit, offset]
    );
    return result.rows;
  }

  /**
   * Get dispute statistics
   */
  static async getDisputeStats() {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
         status,
         priority,
         COUNT(*) as count,
         AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_resolution_hours
       FROM disputes 
       WHERE resolved_at IS NOT NULL
       GROUP BY status, priority
       ORDER BY status, priority`
    );
    return result.rows;
  }

  /**
   * Get merchant dispute statistics
   */
  static async getMerchantDisputeStats(merchantId) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
         COUNT(*) as total_disputes,
         COUNT(CASE WHEN status = 'open' THEN 1 END) as open_disputes,
         COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review_disputes,
         COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_disputes,
         COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_disputes,
         AVG(CASE WHEN resolved_at IS NOT NULL THEN EXTRACT(EPOCH FROM (resolved_at - created_at))/3600 ELSE NULL END) as avg_resolution_hours
       FROM disputes 
       WHERE merchant_id = $1`,
      [merchantId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get disputes requiring attention (urgent priority, open status)
   */
  static async getDisputesRequiringAttention() {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM disputes 
       WHERE (priority = 'urgent' OR priority = 'high') 
       AND status IN ('open', 'under_review')
       ORDER BY 
         CASE priority 
           WHEN 'urgent' THEN 1 
           WHEN 'high' THEN 2 
           ELSE 3 
         END,
         created_at ASC`
    );
    return result.rows;
  }

  /**
   * Get dispute by transaction ID
   */
  static async getDisputeByTransactionId(transactionId) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM disputes WHERE transaction_id = $1',
      [transactionId]
    );
    return result.rows[0] || null;
  }

  /**
   * Search disputes
   */
  static async searchDisputes(searchTerm, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM disputes 
       WHERE title ILIKE $1 OR description ILIKE $1
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [`%${searchTerm}%`, limit, offset]
    );
    return result.rows;
  }

  /**
   * Get dispute with transaction details
   */
  static async getDisputeWithTransaction(disputeId) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
         d.*,
         ct.original_transaction_id,
         ct.cashback_amount,
         ct.cashback_percentage,
         ct.status as transaction_status,
         ct.created_at as transaction_created_at
       FROM disputes d
       LEFT JOIN cashback_transactions ct ON d.transaction_id = ct.id
       WHERE d.id = $1`,
      [disputeId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get disputes by date range
   */
  static async getDisputesByDateRange(startDate, endDate, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM disputes 
       WHERE created_at BETWEEN $1 AND $2
       ORDER BY created_at DESC 
       LIMIT $3 OFFSET $4`,
      [startDate, endDate, limit, offset]
    );
    return result.rows;
  }

  /**
   * Get dispute resolution time statistics
   */
  static async getDisputeResolutionStats() {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
         dispute_type,
         priority,
         COUNT(*) as dispute_count,
         AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_resolution_hours,
         MIN(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as min_resolution_hours,
         MAX(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as max_resolution_hours
       FROM disputes 
       WHERE resolved_at IS NOT NULL
       GROUP BY dispute_type, priority
       ORDER BY dispute_type, priority`
    );
    return result.rows;
  }

  /**
   * Get unresolved disputes older than specified hours
   */
  static async getUnresolvedDisputesOlderThan(hours) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM disputes 
       WHERE status IN ('open', 'under_review')
       AND created_at < NOW() - INTERVAL '${hours} hours'
       ORDER BY created_at ASC`
    );
    return result.rows;
  }
}
