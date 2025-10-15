-- Fix profile data fetching for messages
-- This migration ensures that profile data is properly fetched for all users in group chats

-- First, let's create a more robust function that handles missing profile data
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
    -- Try to get profile data, but if it doesn't exist, create a basic profile object
    SELECT jsonb_build_object(
      'id', p.id,
      'full_name', COALESCE(p.full_name, ''),
      'email', COALESCE(p.email, ''),
      'avatar_url', COALESCE(p.avatar_url, '')
    ) INTO v_profile_data
    FROM public.messages m
    LEFT JOIN public.profiles p ON m.user_id = p.id
    WHERE m.id = p_message_id;

    -- If no profile data exists, create a basic one with user info
    IF v_profile_data IS NULL OR (v_profile_data->>'full_name' IS NULL AND v_profile_data->>'email' IS NULL) THEN
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

-- Ensure that all users have profile records
-- This will create missing profile records for existing users
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
