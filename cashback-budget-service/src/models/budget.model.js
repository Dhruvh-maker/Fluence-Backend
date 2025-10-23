import { getPool } from '../config/database.js';

export class BudgetModel {
  /**
   * Create a new merchant budget
   */
  static async createBudget(merchantId, initialAmount = 0.00, currency = 'AED') {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO merchant_budgets (merchant_id, current_balance, total_loaded, currency) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [merchantId, initialAmount, initialAmount, currency]
    );
    return result.rows[0];
  }

  /**
   * Get budget by merchant ID
   */
  static async getBudgetByMerchantId(merchantId) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM merchant_budgets WHERE merchant_id = $1',
      [merchantId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get budget by ID
   */
  static async getBudgetById(budgetId) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM merchant_budgets WHERE id = $1',
      [budgetId]
    );
    return result.rows[0] || null;
  }

  /**
   * Load budget (add money to budget)
   */
  static async loadBudget(budgetId, amount, processedBy, description = 'Budget loaded') {
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current budget
      const budgetResult = await client.query(
        'SELECT * FROM merchant_budgets WHERE id = $1 FOR UPDATE',
        [budgetId]
      );
      
      if (budgetResult.rows.length === 0) {
        throw new Error('Budget not found');
      }
      
      const budget = budgetResult.rows[0];
      const newBalance = parseFloat(budget.current_balance) + parseFloat(amount);
      const newTotalLoaded = parseFloat(budget.total_loaded) + parseFloat(amount);
      
      // Update budget
      await client.query(
        `UPDATE merchant_budgets 
         SET current_balance = $2, total_loaded = $3, updated_at = NOW()
         WHERE id = $1`,
        [budgetId, newBalance, newTotalLoaded]
      );
      
      // Create transaction record
      const transactionResult = await client.query(
        `INSERT INTO budget_transactions (
          merchant_id, budget_id, transaction_type, amount, 
          balance_before, balance_after, description, processed_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          budget.merchant_id, budgetId, 'load', amount,
          budget.current_balance, newBalance, description, processedBy
        ]
      );
      
      await client.query('COMMIT');
      return transactionResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Deduct budget (for cashback payout)
   */
  static async deductBudget(budgetId, amount, processedBy, description = 'Cashback payout') {
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current budget
      const budgetResult = await client.query(
        'SELECT * FROM merchant_budgets WHERE id = $1 FOR UPDATE',
        [budgetId]
      );
      
      if (budgetResult.rows.length === 0) {
        throw new Error('Budget not found');
      }
      
      const budget = budgetResult.rows[0];
      const newBalance = parseFloat(budget.current_balance) - parseFloat(amount);
      
      if (newBalance < 0) {
        throw new Error('Insufficient budget balance');
      }
      
      // Update budget
      await client.query(
        `UPDATE merchant_budgets 
         SET current_balance = $2, updated_at = NOW()
         WHERE id = $1`,
        [budgetId, newBalance]
      );
      
      // Create transaction record
      const transactionResult = await client.query(
        `INSERT INTO budget_transactions (
          merchant_id, budget_id, transaction_type, amount, 
          balance_before, balance_after, description, processed_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          budget.merchant_id, budgetId, 'cashback_payout', amount,
          budget.current_balance, newBalance, description, processedBy
        ]
      );
      
      await client.query('COMMIT');
      return transactionResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get budget transactions
   */
  static async getBudgetTransactions(budgetId, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM budget_transactions 
       WHERE budget_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [budgetId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Get merchant budget transactions
   */
  static async getMerchantBudgetTransactions(merchantId, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM budget_transactions 
       WHERE merchant_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [merchantId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Get budget statistics
   */
  static async getBudgetStats(merchantId) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
         mb.*,
         COUNT(bt.id) as transaction_count,
         SUM(CASE WHEN bt.transaction_type = 'load' THEN bt.amount ELSE 0 END) as total_loaded,
         SUM(CASE WHEN bt.transaction_type = 'cashback_payout' THEN bt.amount ELSE 0 END) as total_spent,
         AVG(CASE WHEN bt.transaction_type = 'cashback_payout' THEN bt.amount ELSE NULL END) as avg_cashback_amount
       FROM merchant_budgets mb
       LEFT JOIN budget_transactions bt ON mb.id = bt.budget_id
       WHERE mb.merchant_id = $1
       GROUP BY mb.id`,
      [merchantId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get all budgets with pagination
   */
  static async getAllBudgets(limit = 50, offset = 0, status = null) {
    const pool = getPool();
    let query = 'SELECT * FROM merchant_budgets';
    let params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` WHERE status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Update budget status
   */
  static async updateBudgetStatus(budgetId, status) {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE merchant_budgets 
       SET status = $2, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [budgetId, status]
    );
    return result.rows[0] || null;
  }

  /**
   * Get budgets requiring attention (low balance, etc.)
   */
  static async getBudgetsRequiringAttention() {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM merchant_budgets 
       WHERE status = 'active' 
       AND (current_balance / NULLIF(total_loaded, 0)) * 100 >= 60
       ORDER BY (current_balance / NULLIF(total_loaded, 0)) * 100 DESC`
    );
    return result.rows;
  }

  /**
   * Get budget utilization percentage
   */
  static async getBudgetUtilization(budgetId) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
         current_balance,
         total_loaded,
         total_spent,
         CASE 
           WHEN total_loaded > 0 THEN (total_spent / total_loaded) * 100
           ELSE 0
         END as utilization_percentage
       FROM merchant_budgets 
       WHERE id = $1`,
      [budgetId]
    );
    return result.rows[0] || null;
  }

  /**
   * Check if budget has sufficient balance
   */
  static async hasSufficientBalance(budgetId, requiredAmount) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT current_balance FROM merchant_budgets WHERE id = $1',
      [budgetId]
    );
    
    if (result.rows.length === 0) {
      return false;
    }
    
    return parseFloat(result.rows[0].current_balance) >= parseFloat(requiredAmount);
  }

  /**
   * Get budget alerts
   */
  static async getBudgetAlerts(merchantId, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM budget_alerts 
       WHERE merchant_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [merchantId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Acknowledge budget alert
   */
  static async acknowledgeBudgetAlert(alertId) {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE budget_alerts 
       SET acknowledged_at = NOW()
       WHERE id = $1 RETURNING *`,
      [alertId]
    );
    return result.rows[0] || null;
  }
}
