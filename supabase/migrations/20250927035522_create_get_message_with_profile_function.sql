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
  -- Replicating the structure of the 'profiles' nested object
  profiles JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id UUID;
  is_member BOOLEAN;
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
      jsonb_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'username', p.username,
        'avatar_url', p.avatar_url
      ) as profiles
    FROM
      public.messages m
      LEFT JOIN public.profiles p ON m.user_id = p.id
    WHERE
      m.id = p_message_id;
  END IF;
END;
$$;