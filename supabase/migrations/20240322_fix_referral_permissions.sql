-- Enable RLS on referrals table if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE tablename = 'referrals'
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies if they don't exist
DO $$ 
BEGIN
    -- Allow users to view referrals where they are the referrer
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'referrals' 
        AND policyname = 'Users can view referrals as referrer'
    ) THEN
        CREATE POLICY "Users can view referrals as referrer"
        ON public.referrals FOR SELECT
        USING (auth.uid() = referrer_id);
    END IF;

    -- Allow users to view their own referral when they are referred
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'referrals' 
        AND policyname = 'Users can view own referral as referred'
    ) THEN
        CREATE POLICY "Users can view own referral as referred"
        ON public.referrals FOR SELECT
        USING (auth.uid() = referred_id);
    END IF;

    -- Allow users to create referrals where they are the referred user
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'referrals' 
        AND policyname = 'Users can create referrals as referred'
    ) THEN
        CREATE POLICY "Users can create referrals as referred"
        ON public.referrals FOR INSERT
        WITH CHECK (auth.uid() = referred_id);
    END IF;
END $$;

-- Create function to check if a referral code exists
CREATE OR REPLACE FUNCTION public.check_referral_code(code text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id 
    FROM users 
    WHERE referral_code = upper(code)
    LIMIT 1;
$$;

-- Create function to add referral
CREATE OR REPLACE FUNCTION public.add_referral(referrer_id uuid, referred_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if referred user already has a referral
    IF EXISTS (SELECT 1 FROM referrals WHERE referred_id = $2) THEN
        RETURN false;
    END IF;

    -- Insert referral
    INSERT INTO referrals (referrer_id, referred_id)
    VALUES ($1, $2);

    -- Update referrer's total_referrals
    UPDATE users 
    SET total_referrals = COALESCE(total_referrals, 0) + 1
    WHERE id = $1;

    RETURN true;
END;
$$;

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.referrals TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_referral_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_referral(uuid, uuid) TO authenticated; 