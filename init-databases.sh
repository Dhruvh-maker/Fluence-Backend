#!/bin/bash
set -e

# Create multiple databases for microservices
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE auth_service;
    CREATE DATABASE merchant_onboarding;
    CREATE DATABASE cashback_budget;
    CREATE DATABASE notification_service;
    CREATE DATABASE points_wallet;
    CREATE DATABASE referral_service;
    CREATE DATABASE social_features;
    
    -- Grant permissions
    GRANT ALL PRIVILEGES ON DATABASE auth_service TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE merchant_onboarding TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE cashback_budget TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE notification_service TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE points_wallet TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE referral_service TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE social_features TO $POSTGRES_USER;
EOSQL

echo "Multiple databases created successfully!"
