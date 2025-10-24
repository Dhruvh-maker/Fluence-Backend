-- Referral Service Database Schema
-- This service handles all referral system operations

-- Create required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS citext;

-- Referral Links Table
CREATE TABLE IF NOT EXISTS referral_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL, -- References auth service users
  referred_user_id UUID, -- References auth service users (null until referral is completed)
  referral_code TEXT UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Referral Rewards Table
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL, -- References auth service users
  referred_user_id UUID NOT NULL, -- References auth service users
  referral_link_id UUID NOT NULL REFERENCES referral_links(id),
  reward_type VARCHAR(20) NOT NULL CHECK (reward_type IN ('signup', 'first_purchase', 'milestone', 'bonus')),
  points_amount INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'awarded', 'expired', 'cancelled')),
  description TEXT,
  awarded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Referral Campaigns Table
CREATE TABLE IF NOT EXISTS referral_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  signup_reward_points INTEGER DEFAULT 0,
  first_purchase_reward_points INTEGER DEFAULT 0,
  milestone_reward_points INTEGER DEFAULT 0,
  bonus_reward_points INTEGER DEFAULT 0,
  max_referrals_per_user INTEGER DEFAULT 0, -- 0 means unlimited
  max_total_referrals INTEGER DEFAULT 0, -- 0 means unlimited
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Referral Statistics Table
CREATE TABLE IF NOT EXISTS referral_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- References auth service users
  total_referrals INTEGER DEFAULT 0,
  successful_referrals INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  total_points_awarded INTEGER DEFAULT 0,
  last_referral_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Referral Leaderboard Table (for caching)
CREATE TABLE IF NOT EXISTS referral_leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- References auth service users
  total_referrals INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  rank_position INTEGER,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Referral Analytics Table
CREATE TABLE IF NOT EXISTS referral_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  total_referrals INTEGER DEFAULT 0,
  successful_referrals INTEGER DEFAULT 0,
  total_points_awarded INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_links_referrer_id ON referral_links (referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_referred_user_id ON referral_links (referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_referral_code ON referral_links (referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_links_status ON referral_links (status);
CREATE INDEX IF NOT EXISTS idx_referral_links_created_at ON referral_links (created_at);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer_id ON referral_rewards (referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referred_user_id ON referral_rewards (referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referral_link_id ON referral_rewards (referral_link_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_reward_type ON referral_rewards (reward_type);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards (status);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_created_at ON referral_rewards (created_at);

CREATE INDEX IF NOT EXISTS idx_referral_campaigns_active ON referral_campaigns (is_active);
CREATE INDEX IF NOT EXISTS idx_referral_campaigns_dates ON referral_campaigns (start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_referral_statistics_user_id ON referral_statistics (user_id);
CREATE INDEX IF NOT EXISTS idx_referral_statistics_total_referrals ON referral_statistics (total_referrals);

CREATE INDEX IF NOT EXISTS idx_referral_leaderboard_user_id ON referral_leaderboard (user_id);
CREATE INDEX IF NOT EXISTS idx_referral_leaderboard_rank ON referral_leaderboard (rank_position);
CREATE INDEX IF NOT EXISTS idx_referral_leaderboard_total_referrals ON referral_leaderboard (total_referrals);

CREATE INDEX IF NOT EXISTS idx_referral_analytics_date ON referral_analytics (date);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character code
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM referral_links WHERE referral_code = code) INTO exists;
    
    -- If code doesn't exist, return it
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update referral statistics
CREATE OR REPLACE FUNCTION update_referral_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update referrer statistics
  INSERT INTO referral_statistics (user_id, total_referrals, successful_referrals, total_points_earned)
  VALUES (NEW.referrer_id, 1, 1, NEW.points_awarded)
  ON CONFLICT (user_id) DO UPDATE SET
    total_referrals = referral_statistics.total_referrals + 1,
    successful_referrals = referral_statistics.successful_referrals + 1,
    total_points_earned = referral_statistics.total_points_earned + NEW.points_awarded,
    last_referral_at = NOW(),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update referral statistics
CREATE TRIGGER trigger_update_referral_statistics
  AFTER INSERT ON referral_links
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_referral_statistics();

-- Function to update leaderboard
CREATE OR REPLACE FUNCTION update_referral_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  -- Update leaderboard for referrer
  INSERT INTO referral_leaderboard (user_id, total_referrals, total_points_earned)
  SELECT 
    user_id,
    total_referrals,
    total_points_earned
  FROM referral_statistics
  WHERE user_id = NEW.referrer_id
  ON CONFLICT (user_id) DO UPDATE SET
    total_referrals = EXCLUDED.total_referrals,
    total_points_earned = EXCLUDED.total_points_earned,
    last_updated = NOW();
  
  -- Update rank positions
  UPDATE referral_leaderboard 
  SET rank_position = subquery.rank
  FROM (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_referrals DESC, total_points_earned DESC) as rank
    FROM referral_leaderboard
  ) subquery
  WHERE referral_leaderboard.user_id = subquery.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update leaderboard
CREATE TRIGGER trigger_update_referral_leaderboard
  AFTER UPDATE ON referral_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_leaderboard();

-- Function to update daily analytics
CREATE OR REPLACE FUNCTION update_referral_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update daily analytics
  INSERT INTO referral_analytics (date, total_referrals, successful_referrals, total_points_awarded)
  VALUES (CURRENT_DATE, 1, 1, NEW.points_awarded)
  ON CONFLICT (date) DO UPDATE SET
    total_referrals = referral_analytics.total_referrals + 1,
    successful_referrals = referral_analytics.successful_referrals + 1,
    total_points_awarded = referral_analytics.total_points_awarded + NEW.points_awarded;
  
  -- Update conversion rate
  UPDATE referral_analytics 
  SET conversion_rate = (successful_referrals::DECIMAL / NULLIF(total_referrals, 0)) * 100
  WHERE date = CURRENT_DATE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update daily analytics
CREATE TRIGGER trigger_update_referral_analytics
  AFTER INSERT ON referral_links
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_referral_analytics();

-- Insert default referral campaign
INSERT INTO referral_campaigns (
  name, description, start_date, signup_reward_points, 
  first_purchase_reward_points, milestone_reward_points, bonus_reward_points
) VALUES (
  'Default Referral Campaign',
  'Default referral campaign for new users',
  NOW(),
  100, -- 100 points for signup
  200, -- 200 points for first purchase
  500, -- 500 points for milestone
  1000 -- 1000 points for bonus
) ON CONFLICT DO NOTHING;
