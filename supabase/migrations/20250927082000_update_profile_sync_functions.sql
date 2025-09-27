-- This migration updates the database functions and triggers
-- to fully synchronize the profiles table with the auth.users table,
-- including the new email field.

-- Drop the old trigger if it exists from previous attempts
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- 1. Update the function for new user creation to include email
-- This function is originally defined in the initial migration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- 2. Create a function to handle user updates for full_name, email, and avatar_url
CREATE OR REPLACE FUNCTION public.update_public_profile_on_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    full_name = NEW.raw_user_meta_data->>'full_name',
    email = NEW.email,
    avatar_url = NEW.raw_user_meta_data->>'avatar_url',
    updated_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- 3. Create a new trigger to execute the update function when user data changes
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  -- Execute only if email or user metadata has changed to avoid unnecessary updates
  WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data OR OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.update_public_profile_on_user_update();