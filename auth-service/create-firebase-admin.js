#!/usr/bin/env node

/**
 * Script to create an admin user in Firebase Authentication
 * Usage: node create-firebase-admin.js
 */

import admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createFirebaseAdmin() {
    try {
        console.log('🔥 Creating Firebase Admin User for Fluence Pay App');
        console.log('==================================================\n');

        // Initialize Firebase Admin SDK
        const credJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (!credJson) {
            console.error('❌ FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set');
            console.log('\nPlease check your .env file');
            process.exit(1);
        }

        let serviceAccount;
        try {
            serviceAccount = JSON.parse(credJson);
            console.log('✅ Firebase credentials loaded successfully');
            console.log(`   Project ID: ${serviceAccount.project_id}`);
        } catch (error) {
            console.error('❌ Invalid FIREBASE_SERVICE_ACCOUNT_JSON format');
            process.exit(1);
        }

        const credential = admin.credential.cert(serviceAccount);
        admin.initializeApp({ credential });
        console.log('✅ Firebase Admin SDK initialized\n');

        // Admin credentials
        const email = 'admin@gmail.com';
        const password = 'admin12345678';
        const displayName = 'admin';

        console.log('Creating admin user with:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`   Display Name: ${displayName}\n`);

        try {
            // Try to get existing user first
            let userRecord;
            try {
                userRecord = await admin.auth().getUserByEmail(email);
                console.log('⚠️  User already exists in Firebase');
                console.log(`   UID: ${userRecord.uid}`);
                console.log(`   Email: ${userRecord.email}\n`);

                // Update password and set admin role
                await admin.auth().updateUser(userRecord.uid, {
                    password: password,
                    displayName: displayName,
                    emailVerified: true,
                });

                console.log('✅ User password updated successfully');

            } catch (error) {
                if (error.code === 'auth/user-not-found') {
                    // Create new user
                    userRecord = await admin.auth().createUser({
                        email: email,
                        password: password,
                        displayName: displayName,
                        emailVerified: true,
                    });

                    console.log('✅ Firebase admin user created successfully!');
                    console.log(`   UID: ${userRecord.uid}`);
                    console.log(`   Email: ${userRecord.email}`);
                } else {
                    throw error;
                }
            }

            // Set custom claims for admin role
            await admin.auth().setCustomUserClaims(userRecord.uid, {
                role: 'admin',
                isAdmin: true,
            });

            console.log('✅ Admin role set successfully');

            console.log('\n🎉 Setup complete! You can now:');
            console.log('   1. Start the auth service: npm start');
            console.log('   2. Run the Flutter app: flutter run');
            console.log('   3. Login with these credentials:');
            console.log(`      Email: ${email}`);
            console.log(`      Password: ${password}`);

        } catch (error) {
            console.error('❌ Error creating/updating Firebase user:', error.message);
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Run the script
createFirebaseAdmin();
