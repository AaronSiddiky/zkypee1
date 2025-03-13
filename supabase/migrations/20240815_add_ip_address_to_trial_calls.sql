-- Add ip_address column to trial_calls table
ALTER TABLE public.trial_calls ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Create index on ip_address for better query performance
CREATE INDEX IF NOT EXISTS trial_calls_ip_address_idx ON public.trial_calls(ip_address);

-- Update existing RLS policies to include ip_address
DROP POLICY IF EXISTS "Service role can access all trial calls" ON public.trial_calls;
CREATE POLICY "Service role can access all trial calls"
  ON public.trial_calls
  FOR ALL
  TO service_role
  USING (true);

-- Create policy for authenticated users to view their own trial calls
DROP POLICY IF EXISTS "Users can view their own trial calls" ON public.trial_calls;
CREATE POLICY "Users can view their own trial calls"
  ON public.trial_calls
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Comment on the ip_address column
COMMENT ON COLUMN public.trial_calls.ip_address IS 'IP address of the device used for trial calls'; 