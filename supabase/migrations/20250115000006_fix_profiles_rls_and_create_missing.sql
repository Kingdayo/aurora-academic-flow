-- Fix profiles RLS policies and create missing profile records
-- This migration ensures all users have profile records and RLS allows access

-- First, create missing profile records for all users who don't have them
INSERT INTO public.profiles (id, full_name, email, avatar_url)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  u.email,
  COALESCE(u.raw_user_meta_data->>'avatar_url', '')
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Group members can view each other's profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow viewing of own profile and group members profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a more permissive policy that allows group members to see each other's profiles
CREATE POLICY "Allow group members to view profiles"
ON public.profiles FOR SELECT
USING (
  -- Users can always see their own profile
  auth.uid() = profiles.id
  OR
  -- Users can see profiles of other users who are in the same groups
  EXISTS (
    SELECT 1
    FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() 
      AND gm2.user_id = profiles.id
      AND gm1.status = 'active'
      AND gm2.status = 'active'
  )
  OR
  -- Allow access if both users are in any group together (more permissive)
  EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.user_id = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM public.group_members gm2
        WHERE gm2.group_id = gm.group_id
          AND gm2.user_id = profiles.id
          AND gm2.status = 'active'
      )
      AND gm.status = 'active'
  )
);

-- Grant necessary permissions
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Update the get_message_with_profile function to be more robust
CREATE OR REPLACE FUNCTION public.get_message_with_profile(p_message_id UUID)
RETURNS TABLE (
  id UUID,
  group_id UUID,
  user_id UUID,
  content TEXT,
  message_type TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  profiles JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id UUID;
  is_member BOOLEAN;
  v_profile_data JSONB;
BEGIN
  -- Get the group_id for the given message
  SELECT m.group_id INTO v_group_id FROM public.messages m WHERE m.id = p_message_id;

  -- Check if the calling user is a member of that group to authorize access
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = v_group_id
      AND gm.user_id = auth.uid()
      AND gm.status = 'active'
  ) INTO is_member;

  -- If the user is a member, return the message with the profile
  IF is_member THEN
    -- Try to get profile data
    SELECT jsonb_build_object(
      'id', p.id,
      'full_name', COALESCE(p.full_name, ''),
      'email', COALESCE(p.email, ''),
      'avatar_url', COALESCE(p.avatar_url, '')
    ) INTO v_profile_data
    FROM public.messages m
    LEFT JOIN public.profiles p ON m.user_id = p.id
    WHERE m.id = p_message_id;

    -- If no profile data exists, try to get it from auth.users
    IF v_profile_data IS NULL OR (v_profile_data->>'full_name' = '' AND v_profile_data->>'email' = '') THEN
      SELECT jsonb_build_object(
        'id', m.user_id,
        'full_name', COALESCE(u.raw_user_meta_data->>'full_name', ''),
        'email', COALESCE(u.email, ''),
        'avatar_url', COALESCE(u.raw_user_meta_data->>'avatar_url', '')
      ) INTO v_profile_data
      FROM public.messages m
      LEFT JOIN auth.users u ON m.user_id = u.id
      WHERE m.id = p_message_id;
    END IF;

    -- If still no data, create a basic profile
    IF v_profile_data IS NULL THEN
      SELECT jsonb_build_object(
        'id', m.user_id,
        'full_name', '',
        'email', '',
        'avatar_url', ''
      ) INTO v_profile_data
      FROM public.messages m
      WHERE m.id = p_message_id;
    END IF;

    RETURN QUERY
    SELECT
      m.id,
      m.group_id,
      m.user_id,
      m.content,
      m.message_type,
      m.metadata,
      m.created_at,
      m.updated_at,
      v_profile_data as profiles
    FROM
      public.messages m
    WHERE
      m.id = p_message_id;
  END IF;
END;
$$;
