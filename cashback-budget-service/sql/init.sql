-- Cashback & Budget Service Database Schema
-- This service handles merchant budgets, cashback campaigns, and financial transactions

-- Create required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS citext;

-- Merchant Budgets Table
CREATE TABLE IF NOT EXISTS merchant_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL, -- References merchant service
  current_balance DECIMAL(15,2) DEFAULT 0.00 CHECK (current_balance >= 0),
  total_loaded DECIMAL(15,2) DEFAULT 0.00 CHECK (total_loaded >= 0),
  total_spent DECIMAL(15,2) DEFAULT 0.00 CHECK (total_spent >= 0),
  currency VARCHAR(3) DEFAULT 'AED',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'exhausted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget Transactions Table
CREATE TABLE IF NOT EXISTS budget_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL,
  budget_id UUID NOT NULL REFERENCES merchant_budgets(id),
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('load', 'cashback_payout', 'refund', 'adjustment')),
  amount DECIMAL(15,2) NOT NULL,
  balance_before DECIMAL(15,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL,
  reference_id VARCHAR(255),
  description TEXT,
  processed_by UUID, -- References auth service users
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cashback Campaigns Table
CREATE TABLE IF NOT EXISTS cashback_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL,
  campaign_name VARCHAR(255) NOT NULL,
  cashback_percentage DECIMAL(5,2) NOT NULL CHECK (cashback_percentage > 0 AND cashback_percentage <= 100),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  auto_stop_threshold DECIMAL(5,2) DEFAULT 50.00 CHECK (auto_stop_threshold > 0 AND auto_stop_threshold <= 100),
  alert_threshold DECIMAL(5,2) DEFAULT 60.00 CHECK (alert_threshold > 0 AND alert_threshold <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cashback Transactions Table
CREATE TABLE IF NOT EXISTS cashback_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL,
  campaign_id UUID NOT NULL REFERENCES cashback_campaigns(id),
  customer_id UUID NOT NULL, -- References auth service users
  original_transaction_id VARCHAR(255) NOT NULL,
  cashback_amount DECIMAL(15,2) NOT NULL CHECK (cashback_amount > 0),
  cashback_percentage DECIMAL(5,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed', 'disputed')),
  processed_at TIMESTAMPTZ,
  error_type VARCHAR(50),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget Alerts Table
CREATE TABLE IF NOT EXISTS budget_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL,
  budget_id UUID NOT NULL REFERENCES merchant_budgets(id),
  alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('threshold_reached', 'budget_low', 'auto_stop_triggered')),
  threshold_percentage DECIMAL(5,2) NOT NULL,
  current_percentage DECIMAL(5,2) NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disputes Table
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL,
  transaction_id UUID REFERENCES cashback_transactions(id),
  dispute_type VARCHAR(20) NOT NULL CHECK (dispute_type IN ('cashback_amount', 'unauthorized_transaction', 'system_error', 'other')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'rejected')),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID, -- References auth service admin users
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_merchant_budgets_merchant_id ON merchant_budgets (merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_budgets_status ON merchant_budgets (status);
CREATE INDEX IF NOT EXISTS idx_merchant_budgets_created_at ON merchant_budgets (created_at);

CREATE INDEX IF NOT EXISTS idx_budget_transactions_merchant_id ON budget_transactions (merchant_id);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_budget_id ON budget_transactions (budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_type ON budget_transactions (transaction_type);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_created_at ON budget_transactions (created_at);

CREATE INDEX IF NOT EXISTS idx_cashback_campaigns_merchant_id ON cashback_campaigns (merchant_id);
CREATE INDEX IF NOT EXISTS idx_cashback_campaigns_status ON cashback_campaigns (status);
CREATE INDEX IF NOT EXISTS idx_cashback_campaigns_dates ON cashback_campaigns (start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_cashback_transactions_merchant_id ON cashback_transactions (merchant_id);
CREATE INDEX IF NOT EXISTS idx_cashback_transactions_campaign_id ON cashback_transactions (campaign_id);
CREATE INDEX IF NOT EXISTS idx_cashback_transactions_customer_id ON cashback_transactions (customer_id);
CREATE INDEX IF NOT EXISTS idx_cashback_transactions_status ON cashback_transactions (status);
CREATE INDEX IF NOT EXISTS idx_cashback_transactions_created_at ON cashback_transactions (created_at);
CREATE INDEX IF NOT EXISTS idx_cashback_transactions_error_type ON cashback_transactions (error_type);
CREATE INDEX IF NOT EXISTS idx_cashback_transactions_processed_at ON cashback_transactions (processed_at);

CREATE INDEX IF NOT EXISTS idx_budget_alerts_merchant_id ON budget_alerts (merchant_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_budget_id ON budget_alerts (budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_type ON budget_alerts (alert_type);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_created_at ON budget_alerts (created_at);

CREATE INDEX IF NOT EXISTS idx_disputes_merchant_id ON disputes (merchant_id);
CREATE INDEX IF NOT EXISTS idx_disputes_transaction_id ON disputes (transaction_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes (status);
CREATE INDEX IF NOT EXISTS idx_disputes_priority ON disputes (priority);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes (created_at);

-- Function to update budget balance
CREATE OR REPLACE FUNCTION update_budget_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update merchant_budgets table with new balance
  IF TG_OP = 'INSERT' THEN
    UPDATE merchant_budgets 
    SET 
      current_balance = NEW.balance_after,
      total_spent = CASE 
        WHEN NEW.transaction_type = 'cashback_payout' THEN total_spent + NEW.amount
        ELSE total_spent
      END,
      updated_at = NOW()
    WHERE id = NEW.budget_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update budget balance
CREATE TRIGGER trigger_update_budget_balance
  AFTER INSERT ON budget_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_balance();

-- Function to check budget thresholds and create alerts
CREATE OR REPLACE FUNCTION check_budget_thresholds()
RETURNS TRIGGER AS $$
DECLARE
  budget_record RECORD;
  current_percentage DECIMAL(5,2);
BEGIN
  -- Get budget details
  SELECT * INTO budget_record FROM merchant_budgets WHERE id = NEW.budget_id;
  
  -- Calculate current percentage of budget used
  current_percentage := (budget_record.total_spent / NULLIF(budget_record.total_loaded, 0)) * 100;
  
  -- Check if we need to create alerts
  IF current_percentage >= 60.00 AND current_percentage < 100.00 THEN
    INSERT INTO budget_alerts (
      merchant_id, budget_id, alert_type, threshold_percentage, 
      current_percentage, message
    ) VALUES (
      NEW.merchant_id, NEW.budget_id, 'threshold_reached', 60.00,
      current_percentage, 'Budget utilization has reached 60%'
    );
  END IF;
  
  IF current_percentage >= 50.00 THEN
    INSERT INTO budget_alerts (
      merchant_id, budget_id, alert_type, threshold_percentage,
      current_percentage, message
    ) VALUES (
      NEW.merchant_id, NEW.budget_id, 'auto_stop_triggered', 50.00,
      current_percentage, 'Budget utilization has reached 50% - Auto-stop triggered'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check budget thresholds
CREATE TRIGGER trigger_check_budget_thresholds
  AFTER INSERT ON budget_transactions
  FOR EACH ROW
  EXECUTE FUNCTION check_budget_thresholds();

-- Function to validate campaign dates
CREATE OR REPLACE FUNCTION validate_campaign_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if start_date is before end_date
  IF NEW.start_date >= NEW.end_date THEN
    RAISE EXCEPTION 'Campaign start date must be before end date';
  END IF;
  
  -- Check if campaign is not in the past
  IF NEW.start_date < NOW() AND NEW.status = 'active' THEN
    RAISE EXCEPTION 'Cannot create active campaign with start date in the past';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate campaign dates
CREATE TRIGGER trigger_validate_campaign_dates
  BEFORE INSERT OR UPDATE ON cashback_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION validate_campaign_dates();

-- Function to update campaign status based on dates
CREATE OR REPLACE FUNCTION update_campaign_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-complete campaigns that have passed their end date
  IF NEW.end_date < NOW() AND NEW.status = 'active' THEN
    NEW.status := 'completed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update campaign status
CREATE TRIGGER trigger_update_campaign_status
  BEFORE INSERT OR UPDATE ON cashback_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_status();
