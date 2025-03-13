-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Anyone can insert trial calls" ON public.trial_calls;
DROP POLICY IF EXISTS "Service role can access all trial calls" ON public.trial_calls;

-- Create policy for inserting trial calls (allow anyone)
CREATE POLICY "Anyone can insert trial calls"
  ON public.trial_calls
  FOR INSERT
  WITH CHECK (true);

-- Recreate service role policy with full access
CREATE POLICY "Service role can access all trial calls"
  ON public.trial_calls
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT INSERT ON public.trial_calls TO anon;
GRANT INSERT ON public.trial_calls TO authenticated; 