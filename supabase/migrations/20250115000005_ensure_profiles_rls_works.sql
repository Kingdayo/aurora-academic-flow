-- Ensure profiles RLS policy allows group members to see each other's profiles
-- This migration fixes any issues with the profiles RLS policy

-- Drop the existing policy to recreate it
DROP POLICY IF EXISTS "Allow viewing of own profile and group members profiles" ON public.profiles;

-- Create a more permissive policy for group members
CREATE POLICY "Group members can view each other's profiles"
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
);

-- Also ensure that the get_message_with_profile function can access profile data
-- by granting necessary permissions
GRANT SELECT ON public.profiles TO authenticated;
