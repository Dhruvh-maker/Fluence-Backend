import fs from 'fs';

const filePath = './src/models/transaction.model.js';
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Change table name
content = content.replace('FROM transactions WHERE 1=1', 'FROM cashback_transactions WHERE 1=1');

// Fix 2: Change status values
content = content.replace(/status = 'completed'/g, "status = 'processed'");

// Fix 3: Fix amount calculation
content = content.replace('THEN amount ELSE', 'THEN cashback_amount / (cashback_percentage / 100) ELSE');

fs.writeFileSync(filePath, content);
console.log('✅ Fixed transaction.model.js - queries cashback_transactions table now');
