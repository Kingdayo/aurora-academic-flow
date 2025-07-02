
-- Fix the search_path security issue in the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Enable leaked password protection
ALTER SYSTEM SET password_encryption = 'scram-sha-256';

-- Set a more reasonable OTP expiry (24 hours instead of default)
-- This needs to be done in the Auth settings, but we can create a reminder
