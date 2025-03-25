-- Add referral-related columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10,2) DEFAULT 0; 