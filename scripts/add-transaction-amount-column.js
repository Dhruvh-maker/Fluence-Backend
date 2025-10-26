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

async function addTransactionAmountColumn() {
    const pool = new Pool(config);

    try {
        console.log('🔧 Adding transaction_amount column to cashback_transactions table...\n');

        // Check if column already exists
        const checkColumn = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'cashback_transactions' 
            AND column_name = 'transaction_amount'
        `);

        if (checkColumn.rows.length > 0) {
            console.log('✅ Column transaction_amount already exists!');
            return;
        }

        // Add the column
        await pool.query(`
            ALTER TABLE cashback_transactions 
            ADD COLUMN transaction_amount DECIMAL(15,2) DEFAULT 0.00 CHECK (transaction_amount >= 0)
        `);

        console.log('✅ Column transaction_amount added successfully!');
        console.log('📝 Note: Existing rows will have transaction_amount = 0.00');
        console.log('   You may want to calculate and update these values based on cashback_amount and cashback_percentage');

    } catch (error) {
        console.error('❌ Error adding column:', error.message);
        console.error('   Details:', error);
    } finally {
        await pool.end();
    }
}

addTransactionAmountColumn();
