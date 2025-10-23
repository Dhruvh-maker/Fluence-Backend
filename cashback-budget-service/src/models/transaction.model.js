import { getPool } from '../config/database.js';

export class TransactionModel {
  /**
   * Create a new cashback transaction
   */
  static async createTransaction(transactionData) {
    const pool = getPool();
    const {
      merchantId,
      campaignId,
      customerId,
      originalTransactionId,
      cashbackAmount,
      cashbackPercentage
    } = transactionData;

    const result = await pool.query(
      `INSERT INTO cashback_transactions (
        merchant_id, campaign_id, customer_id, original_transaction_id,
        cashback_amount, cashback_percentage
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        merchantId, campaignId, customerId, originalTransactionId,
        cashbackAmount, cashbackPercentage
      ]
    );
    return result.rows[0];
  }

  /**
   * Get transaction by ID
   */
  static async getTransactionById(transactionId) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM cashback_transactions WHERE id = $1',
      [transactionId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get transactions by merchant ID
   */
  static async getTransactionsByMerchantId(merchantId, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM cashback_transactions 
       WHERE merchant_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [merchantId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Get transactions by customer ID
   */
  static async getTransactionsByCustomerId(customerId, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM cashback_transactions 
       WHERE customer_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [customerId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Get transactions by campaign ID
   */
  static async getTransactionsByCampaignId(campaignId, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM cashback_transactions 
       WHERE campaign_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [campaignId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Get transactions by status
   */
  static async getTransactionsByStatus(status, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM cashback_transactions 
       WHERE status = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );
    return result.rows;
  }

  /**
   * Update transaction status
   */
  static async updateTransactionStatus(transactionId, status, processedAt = null) {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE cashback_transactions 
       SET status = $2, processed_at = $3
       WHERE id = $1 RETURNING *`,
      [transactionId, status, processedAt || new Date()]
    );
    return result.rows[0] || null;
  }

  /**
   * Get pending transactions
   */
  static async getPendingTransactions(limit = 100) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM cashback_transactions 
       WHERE status = 'pending' 
       ORDER BY created_at ASC 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Get transaction statistics
   */
  static async getTransactionStats(merchantId = null, startDate = null, endDate = null) {
    const pool = getPool();
    let query = `
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN status = 'processed' THEN 1 END) as processed_transactions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
        COUNT(CASE WHEN status = 'disputed' THEN 1 END) as disputed_transactions,
        SUM(CASE WHEN status = 'processed' THEN cashback_amount ELSE 0 END) as total_cashback_paid,
        AVG(CASE WHEN status = 'processed' THEN cashback_amount ELSE NULL END) as avg_cashback_amount
      FROM cashback_transactions
    `;
    
    const params = [];
    let paramCount = 0;
    const conditions = [];

    if (merchantId) {
      paramCount++;
      conditions.push(`merchant_id = $${paramCount}`);
      params.push(merchantId);
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

    const result = await pool.query(query, params);
    return result.rows[0] || null;
  }

  /**
   * Get daily transaction summary
   */
  static async getDailyTransactionSummary(merchantId, startDate, endDate) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
         DATE(created_at) as date,
         COUNT(*) as transaction_count,
         SUM(cashback_amount) as total_cashback,
         AVG(cashback_amount) as avg_cashback,
         COUNT(CASE WHEN status = 'processed' THEN 1 END) as processed_count,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
         COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
       FROM cashback_transactions 
       WHERE merchant_id = $1 
       AND created_at BETWEEN $2 AND $3
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [merchantId, startDate, endDate]
    );
    return result.rows;
  }

  /**
   * Get transaction by original transaction ID
   */
  static async getTransactionByOriginalId(originalTransactionId) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM cashback_transactions WHERE original_transaction_id = $1',
      [originalTransactionId]
    );
    return result.rows[0] || null;
  }

  /**
   * Check if transaction exists for original transaction
   */
  static async hasTransactionForOriginalId(originalTransactionId) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM cashback_transactions WHERE original_transaction_id = $1',
      [originalTransactionId]
    );
    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * Get failed transactions
   */
  static async getFailedTransactions(limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM cashback_transactions 
       WHERE status = 'failed' 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  /**
   * Retry failed transaction
   */
  static async retryFailedTransaction(transactionId) {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE cashback_transactions 
       SET status = 'pending', processed_at = NULL
       WHERE id = $1 AND status = 'failed' RETURNING *`,
      [transactionId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get transaction history for customer
   */
  static async getCustomerTransactionHistory(customerId, merchantId = null, limit = 50, offset = 0) {
    const pool = getPool();
    let query = `
      SELECT * FROM cashback_transactions 
      WHERE customer_id = $1
    `;
    const params = [customerId];
    let paramCount = 1;

    if (merchantId) {
      paramCount++;
      query += ` AND merchant_id = $${paramCount}`;
      params.push(merchantId);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get top customers by cashback amount
   */
  static async getTopCustomersByCashback(merchantId, limit = 10) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
         customer_id,
         COUNT(*) as transaction_count,
         SUM(cashback_amount) as total_cashback,
         AVG(cashback_amount) as avg_cashback
       FROM cashback_transactions 
       WHERE merchant_id = $1 AND status = 'processed'
       GROUP BY customer_id
       ORDER BY total_cashback DESC 
       LIMIT $2`,
      [merchantId, limit]
    );
    return result.rows;
  }

  /**
   * Get transaction volume by hour
   */
  static async getTransactionVolumeByHour(merchantId, startDate, endDate) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
         EXTRACT(HOUR FROM created_at) as hour,
         COUNT(*) as transaction_count,
         SUM(cashback_amount) as total_cashback
       FROM cashback_transactions 
       WHERE merchant_id = $1 
       AND created_at BETWEEN $2 AND $3
       GROUP BY EXTRACT(HOUR FROM created_at)
       ORDER BY hour ASC`,
      [merchantId, startDate, endDate]
    );
    return result.rows;
  }
}
