-- Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES public.users(id),
    referred_id UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    converted_at TIMESTAMP WITH TIME ZONE,
    reward_paid BOOLEAN DEFAULT FALSE,
    reward_amount DECIMAL(10, 2) DEFAULT 1.00,
    UNIQUE(referred_id)
);

-- Add referral_code and total_referrals to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(5) UNIQUE,
ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0;

-- Create function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_unique_referral_code()
RETURNS VARCHAR(5) AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result VARCHAR(5) := '';
    i INTEGER;
BEGIN
    LOOP
        result := '';
        FOR i IN 1..5 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;
        
        -- Check if code already exists
        IF NOT EXISTS (SELECT 1 FROM public.users WHERE referral_code = result) THEN
            RETURN result;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate referral code for new users
CREATE OR REPLACE FUNCTION create_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        LOOP
            NEW.referral_code := generate_unique_referral_code();
            EXIT WHEN NOT EXISTS (
                SELECT 1 FROM public.users WHERE referral_code = NEW.referral_code
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_user_has_referral_code
    BEFORE INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION create_referral_code();

-- Add policies for referrals table
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Ensure public.users has RLS enabled and appropriate policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can create users" ON public.users;

-- Create policies for users table
CREATE POLICY "Users can view their own profile"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can create users"
    ON public.users
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Create policies for referrals
CREATE POLICY "Users can view their own referrals"
    ON public.referrals
    FOR SELECT
    USING (auth.uid() = referrer_id);

CREATE POLICY "Users can insert referrals"
    ON public.referrals
    FOR INSERT
    WITH CHECK (auth.uid() = referred_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT ON public.referrals TO authenticated;
GRANT UPDATE(reward_paid, converted_at) ON public.referrals TO authenticated; 