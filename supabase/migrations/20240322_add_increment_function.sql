-- Create the increment_referral_count function
CREATE OR REPLACE FUNCTION public.increment_referral_count(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users
  SET total_referrals = COALESCE(total_referrals, 0) + 1
  WHERE id = user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_referral_count(UUID) TO authenticated; 