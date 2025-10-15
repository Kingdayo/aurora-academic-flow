CREATE OR REPLACE FUNCTION public.get_group_member_count(p_group_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_count INT;
  is_member BOOLEAN;
BEGIN
  -- First, check if the calling user is a member of the group.
  -- This is a crucial security check for a SECURITY DEFINER function.
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = p_group_id
      AND user_id = auth.uid()
      AND status = 'active'
  ) INTO is_member;

  IF is_member THEN
    -- If they are a member, get the count of all active members.
    SELECT count(*)
    INTO member_count
    FROM public.group_members
    WHERE group_id = p_group_id
      AND status = 'active';
  ELSE
    -- If they are not a member, return 0 as they are not authorized.
    member_count := 0;
  END IF;

  RETURN member_count;
END;
$$;