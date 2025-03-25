-- Create referral_config table
CREATE TABLE IF NOT EXISTS public.referral_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reward_amount DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default config if not exists
INSERT INTO public.referral_config (reward_amount)
SELECT 1.00
WHERE NOT EXISTS (SELECT 1 FROM public.referral_config);

-- Add RLS policies
ALTER TABLE public.referral_config ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'referral_config' 
        AND policyname = 'Allow read access to authenticated users'
    ) THEN
        CREATE POLICY "Allow read access to authenticated users" ON public.referral_config
        FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

-- Update the increment_referral_count function to add $1 immediately
CREATE OR REPLACE FUNCTION public.increment_referral_count(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update referrer's stats - add 1 to referrals, earnings, and credit balance
    UPDATE public.users
    SET 
        total_referrals = COALESCE(total_referrals, 0) + 1,
        total_earnings = COALESCE(total_earnings, 0) + 1,
        credit_balance = COALESCE(credit_balance, 0) + 1
    WHERE id = user_id;
END;
$$;

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_referral_config_updated_at'
    ) THEN
        CREATE TRIGGER update_referral_config_updated_at
        BEFORE UPDATE ON public.referral_config
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$; 