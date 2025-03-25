-- Create referrals table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    referrer_id UUID NOT NULL REFERENCES public.users(id),
    referred_id UUID NOT NULL REFERENCES public.users(id),
    converted_at TIMESTAMP WITH TIME ZONE,
    reward_paid BOOLEAN DEFAULT FALSE,
    reward_amount DECIMAL(10, 2) DEFAULT 1.00,
    UNIQUE(referred_id)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS referrals_referred_id_idx ON public.referrals(referred_id); 