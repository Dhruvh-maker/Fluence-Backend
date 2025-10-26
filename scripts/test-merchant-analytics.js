import pkg from 'pg';
const { Pool } = pkg;

// Database configuration
const config = {
    host: process.env.CASHBACK_DB_HOST || '161.248.37.208',
    port: process.env.CASHBACK_DB_PORT || 5432,
    database: process.env.CASHBACK_DB_NAME || 'postgres',
    user: process.env.CASHBACK_DB_USER || 'bp-user',
    password: process.env.CASHBACK_DB_PASSWORD || 'k?b0fY3ZB!lB6lJiB*7EqaK',
};

const MERCHANT_ID = '05c5ae69-fcf6-47d3-972f-e7537f223f46';

async function testMerchantAnalytics() {
    const pool = new Pool(config);

    try {
        console.log('🔍 Testing Merchant Analytics for:', MERCHANT_ID);
        console.log('================================================\n');

        // Get comprehensive merchant analytics
        const analyticsQuery = `
            SELECT 
                -- Transaction metrics
                COUNT(*) as total_transactions,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_transactions,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_transactions,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_transactions,
                
                -- Revenue metrics
                SUM(CASE WHEN status = 'completed' THEN transaction_amount ELSE 0 END) as total_revenue,
                SUM(CASE WHEN status = 'completed' THEN cashback_amount ELSE 0 END) as total_cashback,
                AVG(CASE WHEN status = 'completed' THEN transaction_amount ELSE NULL END) as average_transaction_value,
                
                -- Customer metrics
                COUNT(DISTINCT customer_id) as total_customers,
                COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN customer_id END) as active_customers,
                
                -- Monthly metrics (last 30 days)
                SUM(CASE WHEN status = 'completed' AND created_at >= NOW() - INTERVAL '30 days' THEN transaction_amount ELSE 0 END) as monthly_revenue,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as monthly_transactions
            FROM cashback_transactions
            WHERE merchant_id = $1
        `;

        const result = await pool.query(analyticsQuery, [MERCHANT_ID]);
        const analytics = result.rows[0];

        // Calculate retention rate
        const retentionRate = analytics.total_customers > 0
            ? (analytics.active_customers / analytics.total_customers * 100).toFixed(2)
            : 0;

        console.log('📊 Merchant Analytics:');
        console.log('=====================================');
        console.log('Transaction Metrics:');
        console.log(`  Total Transactions: ${analytics.total_transactions}`);
        console.log(`  Completed: ${analytics.completed_transactions}`);
        console.log(`  Pending: ${analytics.pending_transactions}`);
        console.log(`  Failed: ${analytics.failed_transactions}`);
        console.log('');
        console.log('Revenue Metrics:');
        console.log(`  Total Revenue: ${parseFloat(analytics.total_revenue || 0).toFixed(2)} AED`);
        console.log(`  Monthly Revenue: ${parseFloat(analytics.monthly_revenue || 0).toFixed(2)} AED`);
        console.log(`  Total Cashback: ${parseFloat(analytics.total_cashback || 0).toFixed(2)} AED`);
        console.log(`  Avg Transaction: ${parseFloat(analytics.average_transaction_value || 0).toFixed(2)} AED`);
        console.log('');
        console.log('Customer Metrics:');
        console.log(`  Total Customers: ${analytics.total_customers}`);
        console.log(`  Active Customers: ${analytics.active_customers}`);
        console.log(`  Retention Rate: ${retentionRate}%`);
        console.log('');
        console.log('Monthly Performance:');
        console.log(`  Monthly Transactions: ${analytics.monthly_transactions}`);
        console.log(`  Monthly Revenue: ${parseFloat(analytics.monthly_revenue || 0).toFixed(2)} AED`);
        console.log('=====================================\n');

        // Format for Flutter app
        const formattedAnalytics = {
            totalRevenue: parseFloat(analytics.total_revenue || 0),
            monthlyRevenue: parseFloat(analytics.monthly_revenue || 0),
            totalTransactions: parseInt(analytics.total_transactions || 0),
            monthlyTransactions: parseInt(analytics.monthly_transactions || 0),
            averageTransactionValue: parseFloat(analytics.average_transaction_value || 0),
            customerSatisfactionScore: 0.0, // Not available yet
            totalCustomers: parseInt(analytics.total_customers || 0),
            activeCustomers: parseInt(analytics.active_customers || 0),
            customerRetentionRate: parseFloat(retentionRate),
        };

        console.log('📱 Formatted for Flutter:');
        console.log(JSON.stringify(formattedAnalytics, null, 2));
        console.log('\n✅ Analytics test completed successfully!');

    } catch (error) {
        console.error('❌ Error testing analytics:', error.message);
        console.error('   Details:', error);
    } finally {
        await pool.end();
    }
}

testMerchantAnalytics();
