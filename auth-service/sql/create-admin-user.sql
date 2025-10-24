-- Create Initial Admin User Script
-- This script creates an initial admin user for the Fluence Pay App
-- 
-- IMPORTANT: Change the email, password, and other details before running this script
-- The password should be hashed using bcrypt with 12 salt rounds

-- Example admin user (CHANGE THESE VALUES!)
-- Password: 'admin123456' (hashed with bcrypt, 12 salt rounds)
-- You should replace this with your own secure password hash

INSERT INTO users (
  name,
  email,
  password_hash,
  auth_provider,
  role,
  status,
  created_at,
  updated_at
) VALUES (
  'System Administrator',
  'admin@fluencepay.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/9.8.8.8', -- This is a sample hash - REPLACE WITH YOUR OWN
  'password',
  'admin',
  'active',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  status = 'active',
  updated_at = NOW();

-- Verify the admin user was created
SELECT 
  id,
  name,
  email,
  role,
  status,
  created_at
FROM users 
WHERE email = 'admin@fluencepay.com' 
  AND role = 'admin';

-- Instructions:
-- 1. Replace 'admin@fluencepay.com' with your desired admin email
-- 2. Replace the password_hash with a proper bcrypt hash of your chosen password
-- 3. Update the name if desired
-- 4. Run this script in your PostgreSQL database

