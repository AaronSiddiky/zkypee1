-- Create or replace the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.users (id, email, name, credit_balance)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        0  -- Default credit balance
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, public.users.name);
    
    RETURN NEW;
END;
$$;

-- Create the trigger only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'on_auth_user_created'
    ) THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- Ensure all existing auth users have corresponding public user records
DO $$
BEGIN
    INSERT INTO public.users (id, email, name, credit_balance)
    SELECT 
        id,
        email,
        COALESCE((raw_user_meta_data->>'name')::text, ''),
        0
    FROM auth.users
    ON CONFLICT (id) DO NOTHING;
END $$; 