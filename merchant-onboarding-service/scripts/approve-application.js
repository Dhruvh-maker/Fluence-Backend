import { getPool } from '../src/config/database.js';
import { MerchantApplicationModel } from '../src/models/merchant-application.model.js';
import { MerchantProfileModel } from '../src/models/merchant-profile.model.js';

/**
 * Script to approve a pending merchant application and create profile
 * Usage: node scripts/approve-application.js <applicationId>
 */

async function approveApplication(applicationId) {
    try {
        console.log(`\n🔍 Fetching application ${applicationId}...`);

        // Get the application
        const application = await MerchantApplicationModel.getApplicationById(applicationId);

        if (!application) {
            console.error(`❌ Application ${applicationId} not found`);
            process.exit(1);
        }

        console.log(`✅ Found application:`);
        console.log(`   Business Name: ${application.business_name}`);
        console.log(`   Email: ${application.email}`);
        console.log(`   Status: ${application.status}`);

        if (application.status !== 'pending') {
            console.error(`❌ Application is not pending (current status: ${application.status})`);
            process.exit(1);
        }

        console.log(`\n📝 Approving application...`);

        // Update application status to approved
        const updatedApplication = await MerchantApplicationModel.updateApplicationStatus(
            applicationId,
            'approved',
            'admin-script', // Admin ID
            null, // No rejection reason
            'Approved via admin script'
        );

        console.log(`✅ Application approved`);

        // Check if profile already exists
        console.log(`\n🔍 Checking for existing profile...`);
        const existingProfile = await MerchantProfileModel.getProfileByApplicationId(applicationId);

        if (existingProfile) {
            console.log(`ℹ️  Profile already exists (ID: ${existingProfile.id})`);
        } else {
            console.log(`📝 Creating merchant profile...`);

            // Create merchant profile
            const newProfile = await MerchantProfileModel.createProfileFromApplication(updatedApplication);

            console.log(`✅ Merchant profile created successfully!`);
            console.log(`   Profile ID: ${newProfile.id}`);
            console.log(`   User ID: ${newProfile.user_id}`);
            console.log(`   Business Name: ${newProfile.business_name}`);
            console.log(`   Status: ${newProfile.status}`);
        }

        console.log(`\n✅ Application approval complete!`);
        console.log(`\nThe merchant can now:`);
        console.log(`   1. Log in to the app`);
        console.log(`   2. View their profile`);
        console.log(`   3. Access all merchant features`);

    } catch (error) {
        console.error(`\n❌ Error:`, error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        // Close database connection
        const pool = getPool();
        await pool.end();
    }
}

// Get application ID from command line
const applicationId = process.argv[2];

if (!applicationId) {
    console.error('❌ Usage: node scripts/approve-application.js <applicationId>');
    console.error('\nTo find pending applications, run:');
    console.error('   psql -d fluence_merchant_db -c "SELECT id, business_name, email, status FROM merchant_applications WHERE status = \'pending\';"');
    process.exit(1);
}

approveApplication(applicationId);
