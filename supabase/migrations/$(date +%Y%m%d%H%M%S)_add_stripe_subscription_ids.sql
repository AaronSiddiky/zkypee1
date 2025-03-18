-- Add stripe_subscription_ids column to the users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS stripe_subscription_ids TEXT[];

-- Comment on the column
COMMENT ON COLUMN public.users.stripe_subscription_ids IS 'Array of Stripe subscription IDs associated with the user'; 