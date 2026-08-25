-- Migration: Add PayGate integration fields to donations table

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS payment_reference TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'paygate',
  ADD COLUMN IF NOT EXISTS provider_payment_id TEXT, -- stores ipn_token
  ADD COLUMN IF NOT EXISTS txid_in TEXT,
  ADD COLUMN IF NOT EXISTS txid_out TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Update constraint on status if exists or recreate check constraint
ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_status_check;
ALTER TABLE donations ADD CONSTRAINT donations_status_check CHECK (status IN ('pending', 'processing', 'paid', 'verified', 'failed', 'cancelled', 'expired', 'rejected'));

-- Index for payment_reference lookups
CREATE INDEX IF NOT EXISTS idx_donations_payment_reference ON donations(payment_reference);
CREATE INDEX IF NOT EXISTS idx_donations_provider_payment_id ON donations(provider_payment_id);
