#!/usr/bin/env node

/**
 * Database initialization script for Auth Service
 * This script will create the database schema and tables
 */

import { migrate } from './src/db/pool.js';
import { getConfig } from './src/config/index.js';

async function initializeDatabase() {
  try {
    console.log('🚀 Initializing Auth Service Database...');
    console.log('=====================================\n');

    const config = getConfig();
    console.log(`📊 Database: ${config.pg.database}`);
    console.log(`🏠 Host: ${config.pg.host}:${config.pg.port}`);
    console.log(`👤 User: ${config.pg.user}\n`);

    // Run migration
    await migrate();
    
    console.log('✅ Database initialization completed successfully!');
    console.log('\n📋 Created tables:');
    console.log('   - users (with role, status, auth_provider fields)');
    console.log('   - user_sessions');
    console.log('   - password_reset_tokens');
    console.log('   - email_verification_tokens');
    console.log('   - login_attempts');
    console.log('\n🎉 You can now run the admin user creation script!');
    console.log('   Run: node create-admin-user.js');

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure PostgreSQL is running');
    console.log('   2. Check your database connection settings');
    console.log('   3. Ensure the database exists');
    console.log('   4. Verify your credentials');
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase();

