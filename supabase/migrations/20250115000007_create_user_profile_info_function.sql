-- Create a function to safely get user profile information
-- This function can access auth.users data without RLS restrictions

CREATE OR REPLACE FUNCTION public.get_user_profile_info(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_data JSONB;
BEGIN
  -- Try to get data from profiles table first
  SELECT jsonb_build_object(
    'id', p.id,
    'full_name', COALESCE(p.full_name, ''),
    'email', COALESCE(p.email, ''),
    'avatar_url', COALESCE(p.avatar_url, '')
  ) INTO v_user_data
  FROM public.profiles p
  WHERE p.id = p_user_id;

  -- If no profile data, try to get from auth.users
  IF v_user_data IS NULL OR (v_user_data->>'full_name' = '' AND v_user_data->>'email' = '') THEN
    SELECT jsonb_build_object(
      'id', u.id,
      'full_name', COALESCE(u.raw_user_meta_data->>'full_name', ''),
      'email', COALESCE(u.email, ''),
      'avatar_url', COALESCE(u.raw_user_meta_data->>'avatar_url', '')
    ) INTO v_user_data
    FROM auth.users u
    WHERE u.id = p_user_id;
  END IF;

  -- If still no data, return basic info
  IF v_user_data IS NULL THEN
    v_user_data := jsonb_build_object(
      'id', p_user_id,
      'full_name', '',
      'email', '',
      'avatar_url', ''
    );
  END IF;

  RETURN v_user_data;
END;
$$;
