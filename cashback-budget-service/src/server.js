import app from './app.js';
import { getConfig } from './config/index.js';
import { testConnection, migrate, getPool } from './config/database.js';

const config = getConfig();

async function seedTestData() {
  const pool = getPool();
  try {
    // Check if we already have cashback transactions
    const result = await pool.query('SELECT COUNT(*) FROM cashback_transactions');
    if (parseInt(result.rows[0].count) > 0) {
      console.log('📊 Database already has cashback transactions, skipping seed');
      return;
    }

    console.log('🌱 Seeding test data...');

    // First, create test campaigns
    const merchantId = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const campaignId1 = 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const campaignId2 = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    const startDate = new Date(Date.now() + 60000); // 1 minute from now
    const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

    await pool.query(
      `INSERT INTO cashback_campaigns (id, merchant_id, campaign_name, cashback_percentage, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [campaignId1, merchantId, 'Summer Cashback', 10.00, startDate, endDate, 'active']
    );

    await pool.query(
      `INSERT INTO cashback_campaigns (id, merchant_id, campaign_name, cashback_percentage, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [campaignId2, merchantId, 'Winter Special', 15.00, startDate, endDate, 'active']
    );

    console.log('✅ Created test campaigns');

    // Create cashback transactions for multiple test users
    const users = [
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // Mock user
      '1d328714-77f3-4a3d-8d2e-f4e00a89e347'  // Admin user from JWT
    ];

    const allTransactions = [];

    users.forEach((customerId, userIndex) => {
      const userTransactions = [
        [merchantId, campaignId1, customerId, `txn_${userIndex}_001`, 50.00, 10.00, 'processed'],
        [merchantId, campaignId1, customerId, `txn_${userIndex}_002`, 75.00, 10.00, 'processed'],
        [merchantId, campaignId2, customerId, `txn_${userIndex}_003`, 100.00, 15.00, 'processed'],
        [merchantId, campaignId1, customerId, `txn_${userIndex}_004`, 25.00, 10.00, 'pending'],
        [merchantId, campaignId2, customerId, `txn_${userIndex}_005`, 150.00, 15.00, 'processed'],
        [merchantId, campaignId1, customerId, `txn_${userIndex}_006`, 80.00, 10.00, 'processed'],
        [merchantId, campaignId2, customerId, `txn_${userIndex}_007`, 60.00, 15.00, 'pending'],
        [merchantId, campaignId1, customerId, `txn_${userIndex}_008`, 200.00, 10.00, 'processed'],
        [merchantId, campaignId2, customerId, `txn_${userIndex}_009`, 45.00, 15.00, 'disputed'],
        [merchantId, campaignId1, customerId, `txn_${userIndex}_010`, 90.00, 10.00, 'processed']
      ];
      allTransactions.push(...userTransactions);
    });

    const transactions = allTransactions;

    for (const txn of transactions) {
      await pool.query(
        `INSERT INTO cashback_transactions (merchant_id, campaign_id, customer_id, original_transaction_id, cashback_amount, cashback_percentage, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        txn
      );
    }

    console.log(`✅ Seeded ${transactions.length} cashback transactions`);
  } catch (err) {
    console.error('❌ Seed data failed:', err.message);
    console.error('Stack:', err.stack);
  }
}

async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Run migrations in development
    if (config.nodeEnv === 'development') {
      try {
        await migrate();
        console.log('Database migrations completed');

        // Seed data after migration
        await seedTestData();
      } catch (migrationError) {
        console.warn('Database migration failed:', migrationError.message);
        // Don't exit in development, just warn
      }
    }

    // Start server - listen on all network interfaces
    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log(`🚀 Cashback & Budget Service running on port ${config.port}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${config.port}/health`);
      console.log(`📚 API Documentation: http://localhost:${config.port}/`);
      console.log(`🌐 Network: Listening on all interfaces (0.0.0.0:${config.port})`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);

      server.close((err) => {
        if (err) {
          console.error('Error during server shutdown:', err);
          process.exit(1);
        }

        console.log('Server closed successfully');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
