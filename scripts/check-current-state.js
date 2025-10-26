import pkg from 'pg';
const { Pool } = pkg;

const config = {
    host: process.env.CASHBACK_DB_HOST || '161.248.37.208',
    port: process.env.CASHBACK_DB_PORT || 5432,
    database: process.env.CASHBACK_DB_NAME || 'postgres',
    user: process.env.CASHBACK_DB_USER || 'bp-user',
    password: process.env.CASHBACK_DB_PASSWORD || 'k?b0fY3ZB!lB6lJiB*7EqaK',
};

const MERCHANT_ID = '05c5ae69-fcf6-47d3-972f-e7537f223f46';

async function checkCurrentState() {
    const pool = new Pool(config);

    try {
        console.log('🔍 Checking Current Database State');
        console.log('================================================\n');

        // 1. Check what tables exist
        console.log('📋 Available Tables:');
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        tables.rows.forEach(row => console.log(`  - ${row.table_name}`));

        // 2. Check cashback_transactions schema
        console.log('\n📊 cashback_transactions Schema:');
        const schema = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'cashback_transactions' 
            ORDER BY ordinal_position
        `);
        schema.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(required)' : '(optional)'}`);
        });

        // 3. Check if any cashback_transactions exist for our merchant
        console.log(`\n💰 Cashback Transactions for Merchant ${MERCHANT_ID}:`);
        const transactions = await pool.query(`
            SELECT COUNT(*) as count, status, SUM(cashback_amount) as total_cashback
            FROM cashback_transactions
            WHERE merchant_id = $1
            GROUP BY status
        `, [MERCHANT_ID]);

        if (transactions.rows.length === 0) {
            console.log('  ❌ NO TRANSACTIONS FOUND!');
            console.log('  This means the seed script failed silently.');
        } else {
            transactions.rows.forEach(row => {
                console.log(`  - ${row.status}: ${row.count} transactions, ${parseFloat(row.total_cashback).toFixed(2)} AED cashback`);
            });
        }

        // 4. Check campaigns
        console.log(`\n🎯 Campaigns for Merchant ${MERCHANT_ID}:`);
        const campaigns = await pool.query(`
            SELECT id, campaign_name, cashback_percentage, status
            FROM cashback_campaigns
            WHERE merchant_id = $1
        `, [MERCHANT_ID]);

        if (campaigns.rows.length === 0) {
            console.log('  ❌ NO CAMPAIGNS FOUND!');
        } else {
            campaigns.rows.forEach(row => {
                console.log(`  - ${row.campaign_name}: ${row.cashback_percentage}% (${row.status})`);
            });
        }

        // 5. Check merchant budgets
        console.log(`\n💵 Budget for Merchant ${MERCHANT_ID}:`);
        const budgets = await pool.query(`
            SELECT * FROM merchant_budgets WHERE merchant_id = $1
        `, [MERCHANT_ID]);

        if (budgets.rows.length === 0) {
            console.log('  ❌ NO BUDGET FOUND!');
        } else {
            const budget = budgets.rows[0];
            console.log(`  - Current Balance: ${parseFloat(budget.current_balance || 0).toFixed(2)} AED`);
            console.log(`  - Total Loaded: ${parseFloat(budget.total_loaded || 0).toFixed(2)} AED`);
            console.log(`  - Total Spent: ${parseFloat(budget.total_spent || 0).toFixed(2)} AED`);
            console.log(`  - Status: ${budget.status}`);
        }

        console.log('\n================================================');
        console.log('✅ State check completed!');

    } catch (error) {
        console.error('❌ Error checking state:', error.message);
        console.error('   Details:', error);
    } finally {
        await pool.end();
    }
}

checkCurrentState();
