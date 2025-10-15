-- Final fix for profiles RLS policies to allow group members to see each other's profiles
-- This migration ensures all users can see profile data in group chats

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Allow group members to view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow viewing of own profile and group members profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create a simple, permissive policy for profiles
CREATE POLICY "Allow authenticated users to view profiles"
ON public.profiles FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow users to update their own profiles
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = profiles.id);

-- Allow users to insert their own profiles
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = profiles.id);

-- Grant necessary permissions
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Ensure all users have profile records
INSERT INTO public.profiles (id, full_name, email, avatar_url)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  u.email,
  COALESCE(u.raw_user_meta_data->>'avatar_url', '')
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
  email = COALESCE(profiles.email, EXCLUDED.email),
  avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url);
