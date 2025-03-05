-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a public.users table that mirrors auth.users but adds our custom fields
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT,
  credit_balance DECIMAL(10, 2) DEFAULT 0,
  name TEXT,
  avatar_url TEXT
);

-- Create function to automatically create a public.users record when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function when auth.users gets a new record
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert existing auth users into public.users if they don't exist
INSERT INTO public.users (id, email)
SELECT id, email FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  credits_added DECIMAL(10, 2) NOT NULL,
  payment_intent_id TEXT NOT NULL,
  status TEXT NOT NULL,
  
  -- Add a check constraint to ensure amount and credits_added are positive
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT positive_credits CHECK (credits_added > 0)
);

-- Create call_logs table
CREATE TABLE IF NOT EXISTS public.call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  duration_minutes DECIMAL(10, 2) NOT NULL,
  credits_used DECIMAL(10, 2) NOT NULL,
  call_sid TEXT NOT NULL,
  status TEXT NOT NULL,
  
  -- Add a check constraint to ensure duration and credits_used are positive
  CONSTRAINT positive_duration CHECK (duration_minutes > 0),
  CONSTRAINT positive_credits_used CHECK (credits_used > 0)
);

-- Create credit_transfers table for Skype credit transfers
CREATE TABLE IF NOT EXISTS public.credit_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  skype_username TEXT NOT NULL,
  credit_amount DECIMAL(10, 2) NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  
  -- Add a check constraint to ensure credit_amount is positive
  CONSTRAINT positive_transfer_amount CHECK (credit_amount > 0)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS call_logs_user_id_idx ON public.call_logs(user_id);
CREATE INDEX IF NOT EXISTS call_logs_call_sid_idx ON public.call_logs(call_sid);
CREATE INDEX IF NOT EXISTS credit_transfers_email_idx ON public.credit_transfers(email);
CREATE INDEX IF NOT EXISTS credit_transfers_skype_username_idx ON public.credit_transfers(skype_username);

-- Set up Row Level Security (RLS) policies
-- Enable RLS on tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- First drop existing policies to avoid "policy already exists" errors
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view their own call logs" ON public.call_logs;

-- Create policies for users table
CREATE POLICY "Users can view their own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for transactions table
CREATE POLICY "Users can view their own transactions"
  ON public.transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policies for call_logs table
CREATE POLICY "Users can view their own call logs"
  ON public.call_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT SELECT, UPDATE ON public.users TO authenticated;
GRANT SELECT ON public.transactions TO authenticated;
GRANT SELECT ON public.call_logs TO authenticated;
GRANT INSERT, SELECT ON public.credit_transfers TO authenticated; 