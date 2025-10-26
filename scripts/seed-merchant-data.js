import pkg from 'pg';
const { Pool } = pkg;

// Database configurations for different services
const configs = {
    cashback: {
        host: process.env.CASHBACK_DB_HOST || '161.248.37.208',
        port: process.env.CASHBACK_DB_PORT || 5432,
        database: process.env.CASHBACK_DB_NAME || 'postgres',
        user: process.env.CASHBACK_DB_USER || 'bp-user',
        password: process.env.CASHBACK_DB_PASSWORD || 'k?b0fY3ZB!lB6lJiB*7EqaK',
    },
    points: {
        host: process.env.POINTS_DB_HOST || '161.248.37.208',
        port: process.env.POINTS_DB_PORT || 5432,
        database: process.env.POINTS_DB_NAME || 'postgres',
        user: process.env.POINTS_DB_USER || 'bp-user',
        password: process.env.POINTS_DB_PASSWORD || 'k?b0fY3ZB!lB6lJiB*7EqaK',
    },
    social: {
        host: process.env.SOCIAL_DB_HOST || '161.248.37.208',
        port: process.env.SOCIAL_DB_PORT || 5432,
        database: process.env.SOCIAL_DB_NAME || 'postgres',
        user: process.env.SOCIAL_DB_USER || 'bp-user',
        password: process.env.SOCIAL_DB_PASSWORD || 'k?b0fY3ZB!lB6lJiB*7EqaK',
    }
};

// Test merchant user ID
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

async function seedCashbackData() {
    const pool = new Pool(configs.cashback);

    try {
        console.log('🎯 Seeding Cashback & Budget Service...');

        // 1. Create active campaign
        console.log('  📊 Creating active campaign...');
        const campaignResult = await pool.query(
            `INSERT INTO cashback_campaigns (
        merchant_id, campaign_name, cashback_percentage, 
        start_date, end_date, status, auto_stop_threshold, alert_threshold
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT DO NOTHING
      RETURNING id`,
            [
                MERCHANT_ID,
                'Summer Sale 2025',
                15.00,
                new Date('2025-10-26'),  // Today's date
                new Date('2025-12-31'),
                'active',
                50.00,
                60.00
            ]
        );

        const campaignId = campaignResult.rows[0]?.id;
        console.log(`  ✅ Campaign created: ${campaignId}`);

        // 2. Create budget
        console.log('  💰 Creating merchant budget...');
        await pool.query(
            `INSERT INTO merchant_budgets (
        merchant_id, total_budget, available_budget, 
        allocated_budget, spent_budget, status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (merchant_id) DO UPDATE SET
        total_budget = EXCLUDED.total_budget,
        available_budget = EXCLUDED.available_budget`,
            [
                MERCHANT_ID,
                50000.00,
                35000.00,
                10000.00,
                5000.00,
                'active'
            ]
        );
        console.log('  ✅ Budget created');

        // 3. Create transactions (last 30 days)
        console.log('  💳 Creating cashback transactions...');
        const customers = [
            'customer-001',
            'customer-002',
            'customer-003',
            'customer-004',
            'customer-005'
        ];

        for (let i = 0; i < 25; i++) {
            const customerId = customers[Math.floor(Math.random() * customers.length)];
            const transactionAmount = randomAmount(50, 500);
            const cashbackAmount = (transactionAmount * 0.15).toFixed(2);
            const status = Math.random() > 0.1 ? 'completed' : (Math.random() > 0.5 ? 'pending' : 'failed');

            await pool.query(
                `INSERT INTO cashback_transactions (
          merchant_id, campaign_id, customer_id, 
          original_transaction_id, transaction_amount, 
          cashback_amount, cashback_percentage, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    MERCHANT_ID,
                    campaignId,
                    customerId,
                    `TXN-${Date.now()}-${i}`,
                    transactionAmount,
                    cashbackAmount,
                    15.00,
                    status,
                    randomDate(30)
                ]
            );
        }
        console.log('  ✅ 25 transactions created');

        console.log('✅ Cashback data seeded successfully!\n');
    } catch (error) {
        console.error('❌ Error seeding cashback data:', error.message);
    } finally {
        await pool.end();
    }
}

async function seedPointsData() {
    const pool = new Pool(configs.points);

    try {
        console.log('🎯 Seeding Points & Wallet Service...');

        // 1. Create wallet
        console.log('  💼 Creating merchant wallet...');
        await pool.query(
            `INSERT INTO wallet_balances (
        user_id, available_balance, pending_balance, 
        total_earned, total_redeemed
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id) DO UPDATE SET
        available_balance = EXCLUDED.available_balance,
        pending_balance = EXCLUDED.pending_balance,
        total_earned = EXCLUDED.total_earned,
        total_redeemed = EXCLUDED.total_redeemed`,
            [
                MERCHANT_ID,
                12000,  // INTEGER not DECIMAL
                3000,
                25000,
                10000
            ]
        );
        console.log('  ✅ Wallet created');

        // 2. Create point transactions
        console.log('  💎 Creating point transactions...');
        const transactionTypes = ['purchase', 'cashback', 'referral', 'redemption', 'bonus'];

        for (let i = 0; i < 30; i++) {
            const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
            const amount = Math.floor(Math.random() * 900) + 100;  // INTEGER between 100-1000
            const status = Math.random() > 0.15 ? 'available' : (Math.random() > 0.5 ? 'pending' : 'expired');

            await pool.query(
                `INSERT INTO points_transactions (
          user_id, transaction_type, amount, status,
          description, reference_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    MERCHANT_ID,
                    type,
                    amount,
                    status,
                    `${type.charAt(0).toUpperCase() + type.slice(1)} points from transaction`,
                    `REF-${Date.now()}-${i}`,
                    randomDate(30)
                ]
            );
        }
        console.log('  ✅ 30 point transactions created');

        console.log('✅ Points data seeded successfully!\n');
    } catch (error) {
        console.error('❌ Error seeding points data:', error.message);
    } finally {
        await pool.end();
    }
}

async function seedSocialData() {
    const pool = new Pool(configs.social);

    try {
        console.log('🎯 Seeding Social Features Service...');

        // 1. Get platform IDs
        const platformResult = await pool.query(
            'SELECT id, name FROM social_platforms LIMIT 3'
        );
        const platforms = platformResult.rows;

        if (platforms.length === 0) {
            console.log('  ⚠️  No social platforms found, skipping social data');
            return;
        }

        // 2. Create social accounts
        console.log('  📱 Creating social accounts...');
        for (const platform of platforms) {
            await pool.query(
                `INSERT INTO social_accounts (
          user_id, platform_id, platform_user_id, username, 
          is_connected
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, platform_id) DO UPDATE SET
          is_connected = EXCLUDED.is_connected,
          username = EXCLUDED.username`,
                [
                    MERCHANT_ID,
                    platform.id,
                    `user_${Math.floor(Math.random() * 10000)}`,
                    `merchant_${platform.name.toLowerCase()}`,
                    true
                ]
            );
        }
        console.log(`  ✅ ${platforms.length} social accounts created`);

        // 3. Skip social posts for now (complex structure)
        console.log('  ⏭️  Skipping social posts (not required for dashboard)');

        // 4. Create social analytics
        console.log('  📊 Creating social analytics...');
        for (let i = 0; i < 30; i++) {
            const platform = platforms[Math.floor(Math.random() * platforms.length)];
            const date = new Date();
            date.setDate(date.getDate() - i);

            await pool.query(
                `INSERT INTO social_analytics (
          user_id, platform_id, date, posts_count,
          likes_count, shares_count, comments_count,
          total_engagement, engagement_rate, points_earned
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (user_id, platform_id, date) DO UPDATE SET
          posts_count = EXCLUDED.posts_count,
          likes_count = EXCLUDED.likes_count`,
                [
                    MERCHANT_ID,
                    platform.id,
                    date.toISOString().split('T')[0],
                    Math.floor(Math.random() * 3) + 1,
                    Math.floor(Math.random() * 200) + 20,
                    Math.floor(Math.random() * 50) + 5,
                    Math.floor(Math.random() * 30) + 3,
                    Math.floor(Math.random() * 300) + 50,
                    (Math.random() * 5 + 2).toFixed(2),
                    Math.floor(Math.random() * 100) + 10
                ]
            );
        }
        console.log('  ✅ 30 days of analytics created');

        console.log('✅ Social data seeded successfully!\n');
    } catch (error) {
        console.error('❌ Error seeding social data:', error.message);
    } finally {
        await pool.end();
    }
}

async function main() {
    console.log('🚀 Starting data seeding for merchant:', MERCHANT_ID);
    console.log('================================================\n');

    await seedCashbackData();
    await seedPointsData();
    await seedSocialData();

    console.log('================================================');
    console.log('🎉 All data seeded successfully!');
    console.log('📱 Your Flutter app should now show real data!');
}

main().catch(console.error);
