-- Drop the old, restrictive policy that only allows users to see their own profile.
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a new policy that allows users to view the profiles of anyone they share a group with.
CREATE POLICY "Allow group members to view each other's profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    -- Select a record if a common group exists between the current user (auth.uid())
    -- and the user of the profile being queried (profiles.id).
    SELECT 1
    FROM public.group_members g1
    JOIN public.group_members g2 ON g1.group_id = g2.group_id
    WHERE g1.user_id = auth.uid() AND g2.user_id = profiles.id
  )
);