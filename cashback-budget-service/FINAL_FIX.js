import fs from 'fs';

const filePath = './src/models/transaction.model.js';
let content = fs.readFileSync(filePath, 'utf8');

// The complete fixed getAnalytics method
const fixedMethod = `  static async getAnalytics(options = {}) {
    const pool = getPool();
    const { startDate, endDate, type, merchantId } = options;

    let query = \`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'processed' THEN cashback_amount / (cashback_percentage / 100) ELSE 0 END) as total_volume,
        SUM(CASE WHEN status = 'processed' THEN cashback_amount ELSE 0 END) as total_cashback,
        AVG(CASE WHEN status = 'processed' THEN cashback_amount / (cashback_percentage / 100) ELSE NULL END) as average_transaction_value,
        COUNT(DISTINCT customer_id) as total_customers,
        COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN customer_id END) as active_customers,
        SUM(CASE WHEN status = 'processed' AND created_at >= NOW() - INTERVAL '30 days' THEN cashback_amount / (cashback_percentage / 100) ELSE 0 END) as monthly_revenue,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as monthly_transactions,
        ROUND(SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*)::numeric, 0) * 100, 2) as success_rate
      FROM cashback_transactions WHERE 1=1
    \`;

    const params = [];
    let paramCount = 0;

    if (merchantId) {
      paramCount++;
      query += \` AND merchant_id = $\${paramCount}\`;
      params.push(merchantId);
    }

    if (startDate) {
      paramCount++;
      query += \` AND created_at >= $\${paramCount}\`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += \` AND created_at <= $\${paramCount}\`;
      params.push(endDate);
    }

    if (type) {
      paramCount++;
      query += \` AND type = $\${paramCount}\`;
      params.push(type);
    }

    const result = await pool.query(query, params);
    const data = result.rows[0] || {};
    
    const totalCustomers = parseInt(data.total_customers || 0);
    const activeCustomers = parseInt(data.active_customers || 0);
    const retentionRate = totalCustomers > 0 ? (activeCustomers / totalCustomers * 100).toFixed(2) : 0;
    
    return {
      ...data,
      customer_retention_rate: parseFloat(retentionRate)
    };
  }`;

// Find and replace the getAnalytics method
const methodStart = content.indexOf('static async getAnalytics(options = {})');
if (methodStart === -1) {
    console.log('❌ Could not find getAnalytics method');
    process.exit(1);
}

// Find the end of the method (next method or end of class)
const methodEnd = content.indexOf('\n\n  /**', methodStart + 1);
if (methodEnd === -1) {
    console.log('❌ Could not find end of getAnalytics method');
    process.exit(1);
}

// Find the start of the method declaration (including comment)
const commentStart = content.lastIndexOf('/**', methodStart);

// Replace the method
const before = content.substring(0, commentStart);
const after = content.substring(methodEnd);
const newContent = before + '/**\n   * Get transaction analytics from cashback_transactions table\n   */\n' + fixedMethod + after;

fs.writeFileSync(filePath, newContent);
console.log('✅ Successfully replaced getAnalytics method');
console.log('   - Now queries cashback_transactions table');
console.log('   - Adds merchant_id filter');
console.log('   - Calculates all required metrics');
console.log('   - Includes customer retention rate');
