-- Add INSERT policy for transactions table
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;

CREATE POLICY "Users can insert their own transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add INSERT policy for service role to insert transactions for any user
DROP POLICY IF EXISTS "Service role can insert any transaction" ON public.transactions;

CREATE POLICY "Service role can insert any transaction"
  ON public.transactions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Add UPDATE policy for service role to update users
DROP POLICY IF EXISTS "Service role can update any user" ON public.users;

CREATE POLICY "Service role can update any user"
  ON public.users
  FOR UPDATE
  TO service_role
  USING (true);

-- Add INSERT policy for service role to insert users
DROP POLICY IF EXISTS "Service role can insert any user" ON public.users;

CREATE POLICY "Service role can insert any user"
  ON public.users
  FOR INSERT
  TO service_role
  WITH CHECK (true); 