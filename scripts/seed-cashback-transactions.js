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

// Generate random date within last N days
function randomDate(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    return date.toISOString();
}

// Generate random amount
function randomAmount(min, max) {
    return (Math.random() * (max - min) + min).toFixed(2);
}

async function seedCashbackTransactions() {
    const pool = new Pool(config);

    try {
        console.log('🎯 Seeding Cashback Transactions for Merchant:', MERCHANT_ID);
        console.log('================================================\n');

        // 1. Get or create active campaign for this merchant
        console.log('📊 Checking for active campaign...');
        let campaignResult = await pool.query(
            `SELECT id FROM cashback_campaigns 
             WHERE merchant_id = $1 AND status = 'active' 
             LIMIT 1`,
            [MERCHANT_ID]
        );

        let campaignId;
        if (campaignResult.rows.length === 0) {
            console.log('  Creating new campaign...');
            // Add 5 seconds to future to avoid "in the past" validation
            const startDate = new Date(Date.now() + 5000);

            const newCampaign = await pool.query(
                `INSERT INTO cashback_campaigns (
                    merchant_id, campaign_name, cashback_percentage, 
                    start_date, end_date, status, auto_stop_threshold, alert_threshold
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id`,
                [
                    MERCHANT_ID,
                    'Merchant Rewards Program',
                    12.00,
                    startDate,
                    new Date('2025-12-31'),
                    'active',
                    50.00,
                    60.00
                ]
            );
            campaignId = newCampaign.rows[0].id;
            console.log(`  ✅ Campaign created: ${campaignId}`);
        } else {
            campaignId = campaignResult.rows[0].id;
            console.log(`  ✅ Using existing campaign: ${campaignId}`);
        }

        // 2. Create or update merchant budget (using actual schema columns)
        console.log('\n💰 Setting up merchant budget...');
        const existingBudget = await pool.query(
            `SELECT id FROM merchant_budgets WHERE merchant_id = $1`,
            [MERCHANT_ID]
        );

        if (existingBudget.rows.length === 0) {
            await pool.query(
                `INSERT INTO merchant_budgets (
                    merchant_id, current_balance, total_loaded, 
                    total_spent, currency, status
                ) VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    MERCHANT_ID,
                    75000.00,  // current_balance
                    100000.00, // total_loaded
                    25000.00,  // total_spent
                    'AED',
                    'active'
                ]
            );
        }
        console.log('  ✅ Budget configured');

        // 3. Create cashback transactions
        console.log('\n💳 Creating cashback transactions...');
        // Generate UUIDs for test customers
        const customers = [
            '11111111-1111-1111-1111-111111111111',
            '22222222-2222-2222-2222-222222222222',
            '33333333-3333-3333-3333-333333333333',
            '44444444-4444-4444-4444-444444444444',
            '55555555-5555-5555-5555-555555555555',
            '66666666-6666-6666-6666-666666666666',
            '77777777-7777-7777-7777-777777777777',
            '88888888-8888-8888-8888-888888888888'
        ];

        // Status values from schema: 'pending', 'processed', 'failed', 'disputed'
        const statuses = ['processed', 'processed', 'processed', 'processed', 'pending', 'failed'];

        for (let i = 0; i < 50; i++) {
            const customerId = customers[Math.floor(Math.random() * customers.length)];
            const transactionAmount = randomAmount(100, 2000);
            const cashbackAmount = (transactionAmount * 0.12).toFixed(2);
            const status = statuses[Math.floor(Math.random() * statuses.length)];

            await pool.query(
                `INSERT INTO cashback_transactions (
                    merchant_id, campaign_id, customer_id, 
                    original_transaction_id, 
                    cashback_amount, cashback_percentage, status, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    MERCHANT_ID,
                    campaignId,
                    customerId,
                    `TXN-${Date.now()}-${i}`,
                    cashbackAmount,
                    12.00,
                    status,
                    randomDate(30)
                ]
            );
        }
        console.log('  ✅ 50 cashback transactions created');

        // 4. Get summary stats
        console.log('\n📈 Transaction Summary:');
        const summary = await pool.query(
            `SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
                SUM(cashback_amount) as total_cashback,
                SUM(cashback_amount / (cashback_percentage / 100)) as total_volume
            FROM cashback_transactions
            WHERE merchant_id = $1`,
            [MERCHANT_ID]
        );

        const stats = summary.rows[0];
        console.log(`  Total Transactions: ${stats.total}`);
        console.log(`  Completed: ${stats.completed}`);
        console.log(`  Pending: ${stats.pending}`);
        console.log(`  Failed: ${stats.failed}`);
        console.log(`  Total Volume (calculated): ${parseFloat(stats.total_volume || 0).toFixed(2)} AED`);
        console.log(`  Total Cashback: ${parseFloat(stats.total_cashback || 0).toFixed(2)} AED`);

        console.log('\n================================================');
        console.log('🎉 Cashback transactions seeded successfully!');
        console.log('📱 Refresh your Flutter app to see the data!');

    } catch (error) {
        console.error('❌ Error seeding cashback transactions:', error.message);
        console.error('   Details:', error);
    } finally {
        await pool.end();
    }
}

seedCashbackTransactions();
