-- Update existing users with referral codes if they don't have one
DO $$
DECLARE
    user_record RECORD;
    generated_code VARCHAR(5);
BEGIN
    -- Log start of update
    RAISE NOTICE 'Starting to update users without referral codes';
    
    FOR user_record IN SELECT id FROM public.users WHERE referral_code IS NULL
    LOOP
        generated_code := generate_unique_referral_code();
        RAISE NOTICE 'Generated code % for user %', generated_code, user_record.id;
        
        UPDATE public.users
        SET referral_code = generated_code
        WHERE id = user_record.id;
        
        RAISE NOTICE 'Updated user % with code %', user_record.id, generated_code;
    END LOOP;
    
    -- Log completion
    RAISE NOTICE 'Completed updating users with referral codes';
END $$; 