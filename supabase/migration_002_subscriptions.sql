-- Run this in Supabase SQL editor after schema.sql.
-- Adds Stripe + scan-quota tracking.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT,
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scan_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS monthly_scans_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS topup_scans INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS users_stripe_customer_id_idx
  ON users(stripe_customer_id);

-- Extend scans table with new identification fields
ALTER TABLE scans
  ADD COLUMN IF NOT EXISTS materials TEXT,
  ADD COLUMN IF NOT EXISTS condition TEXT,
  ADD COLUMN IF NOT EXISTS estimated_value_low INTEGER,
  ADD COLUMN IF NOT EXISTS estimated_value_high INTEGER,
  ADD COLUMN IF NOT EXISTS value_notes TEXT,
  ADD COLUMN IF NOT EXISTS authenticity TEXT,
  ADD COLUMN IF NOT EXISTS authenticity_signals JSONB;
