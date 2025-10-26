# PRODUCTION FIX - Transaction Analytics

## Problem
The `/api/transactions/analytics` endpoint queries the wrong table (`transactions` instead of `cashback_transactions`), causing the Flutter app to show incorrect data (67000 AED from 10 old transactions instead of 46495 AED from 50 real cashback transactions).

## Fix Required
In `src/models/transaction.model.js`, line 116, the `getAnalytics()` method needs to:
1. Query `cashback_transactions` table instead of `transactions`
2. Calculate `total_volume` as: `cashback_amount / (cashback_percentage / 100)`
3. Add customer metrics: `total_customers`, `active_customers`, `customer_retention_rate`
4. Add monthly metrics: `monthly_revenue`, `monthly_transactions`

## SQL Query to Replace
Change FROM `transactions` to FROM `cashback_transactions`
Change status values from 'completed' to 'processed'
Add calculation for total_volume from cashback data

## Manual Fix Steps
1. Open: `Fluence-Backend-Private/cashback-budget-service/src/models/transaction.model.js`
2. Find line 116: `static async getAnalytics(options = {})`
3. Replace the entire method with the corrected version that queries `cashback_transactions`
4. Restart the cashback service: `npm run dev` in cashback-budget-service directory

## Expected Result After Fix
- Profile Page will show: ~46,495 AED revenue, 50 transactions, 8 customers
- Home Page will show: Real cashback transaction data
- Stats Page will show: Correct analytics from cashback_transactions table
