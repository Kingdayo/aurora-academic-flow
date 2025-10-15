CREATE OR REPLACE FUNCTION public.get_messages_for_group(p_group_id UUID)
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
  is_member BOOLEAN;
BEGIN
  -- First, check if the current user is a member of the requested group.
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = p_group_id
      AND gm.user_id = auth.uid()
      AND gm.status = 'active'
  ) INTO is_member;

  -- If the user is not a member, raise an exception.
  IF NOT is_member THEN
    RAISE EXCEPTION 'User is not a member of the group';
  END IF;

  -- If the user is a member, return all messages for that group,
  -- joining with the profiles table to get the sender's information.
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
      'email', p.email,
      'avatar_url', p.avatar_url
    ) as profiles
  FROM
    public.messages m
    LEFT JOIN public.profiles p ON m.user_id = p.id
  WHERE
    m.group_id = p_group_id
  ORDER BY
    m.created_at ASC;
END;
$$;