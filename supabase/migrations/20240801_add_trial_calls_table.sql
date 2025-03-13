-- Create trial_calls table for tracking trial usage
CREATE TABLE IF NOT EXISTS public.trial_calls (
  device_fingerprint TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_call_at TIMESTAMP WITH TIME ZONE,
  count INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  last_call_sid TEXT,
  last_phone_number TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  converted_to_signup BOOLEAN DEFAULT FALSE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS trial_calls_fingerprint_idx ON public.trial_calls(device_fingerprint);
CREATE INDEX IF NOT EXISTS trial_calls_user_id_idx ON public.trial_calls(user_id);

-- Enable RLS on the trial_calls table
ALTER TABLE public.trial_calls ENABLE ROW LEVEL SECURITY;

-- Create policy for service role to access all trial calls
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

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.trial_calls TO service_role;
GRANT SELECT ON public.trial_calls TO authenticated; 