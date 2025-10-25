#!/usr/bin/env node

/**
 * Script to update existing user to admin role
 * Usage: node update-admin-role.js
 */

import { getPool } from './src/db/pool.js';

async function updateAdminRole() {
    try {
        console.log('🔐 Updating User Role to Admin');
        console.log('================================\n');

        const email = 'admin@gmail.com';

        const pool = getPool();

        // Check if user exists
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);

        if (existingUser.rows.length === 0) {
            console.error('❌ User not found with email:', email);
            process.exit(1);
        }

        console.log('✅ User found:');
        console.log(`   ID: ${existingUser.rows[0].id}`);
        console.log(`   Name: ${existingUser.rows[0].name}`);
        console.log(`   Email: ${existingUser.rows[0].email}`);
        console.log(`   Current Role: ${existingUser.rows[0].role || 'null'}`);
        console.log('\n🔄 Updating role to admin...\n');

        // Update role to admin
        await pool.query(
            'UPDATE users SET role = $1, updated_at = NOW() WHERE email = $2',
            ['admin', email.toLowerCase()]
        );

        // Verify update
        const updatedUser = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);

        console.log('✅ User role updated successfully!');
        console.log(`   ID: ${updatedUser.rows[0].id}`);
        console.log(`   Name: ${updatedUser.rows[0].name}`);
        console.log(`   Email: ${updatedUser.rows[0].email}`);
        console.log(`   New Role: ${updatedUser.rows[0].role}`);

        console.log('\n🎉 Setup complete! You can now login with admin privileges.');

    } catch (error) {
        console.error('❌ Error updating user role:', error.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Run the script
updateAdminRole();
