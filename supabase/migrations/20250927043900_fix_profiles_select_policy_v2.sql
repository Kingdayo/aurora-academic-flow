-- Drop the previous attempt at a policy, if it exists.
DROP POLICY IF EXISTS "Allow group members to view each other's profiles" ON public.profiles;
-- Ensure the original restrictive policy is also dropped, in case the previous migration failed.
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a new, more comprehensive policy.
-- This policy allows a user to view a profile if:
-- 1. It is their own profile.
-- OR
-- 2. They share a group with the user of that profile.
CREATE POLICY "Allow viewing of own profile and group members profiles"
ON public.profiles FOR SELECT
USING (
  -- Condition 1: The user is viewing their own profile.
  auth.uid() = profiles.id
  OR
  -- Condition 2: The profile belongs to a user who is in a group that the current user is also in.
  EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE
      user_id = profiles.id AND
      group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  )
);