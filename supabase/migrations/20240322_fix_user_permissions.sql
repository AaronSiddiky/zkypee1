-- Enable RLS on users table if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE tablename = 'users'
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies if they don't exist
DO $$ 
BEGIN
    -- Read access policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Enable read access to all users'
    ) THEN
        CREATE POLICY "Enable read access to all users"
        ON public.users FOR SELECT
        USING (true);
    END IF;

    -- Update profile policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile"
        ON public.users FOR UPDATE
        USING (auth.uid() = id);
    END IF;

    -- Insert profile policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile"
        ON public.users FOR INSERT
        WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Grant necessary permissions (these statements are idempotent)
GRANT SELECT ON public.users TO authenticated;
GRANT UPDATE (name, avatar_url) ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role; 