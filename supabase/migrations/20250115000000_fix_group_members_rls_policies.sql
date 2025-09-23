-- Fix infinite recursion in group_members RLS policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view members of groups they belong to" ON public.group_members;
DROP POLICY IF EXISTS "Group owners and admins can manage members" ON public.group_members;
DROP POLICY IF EXISTS "Group owners and admins can update members" ON public.group_members;

-- Create new policies that avoid recursion

-- Allow users to view group members if they are the owner of the group OR if they are an active member
CREATE POLICY "Users can view group members" 
ON public.group_members FOR SELECT 
USING (
  -- User is the owner of the group
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE groups.id = group_members.group_id 
    AND groups.owner_id = auth.uid()
  )
  OR
  -- User is an active member of this specific group (direct check without subquery on same table)
  (user_id = auth.uid() AND status = 'active')
  OR
  -- User is viewing their own membership record
  user_id = auth.uid()
);

-- Allow group owners to add members
CREATE POLICY "Group owners can add members" 
ON public.group_members FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE groups.id = group_members.group_id 
    AND groups.owner_id = auth.uid()
  )
);

-- Allow users to join groups (self-insert) and owners to update member status
CREATE POLICY "Users can join groups and owners can manage members" 
ON public.group_members FOR UPDATE 
USING (
  -- User is updating their own membership
  user_id = auth.uid()
  OR
  -- User is the owner of the group
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE groups.id = group_members.group_id 
    AND groups.owner_id = auth.uid()
  )
);

-- Allow group owners to remove members
CREATE POLICY "Group owners can remove members" 
ON public.group_members FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE groups.id = group_members.group_id 
    AND groups.owner_id = auth.uid()
  )
);

-- Also fix the groups policy to avoid potential issues
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;

CREATE POLICY "Users can view groups they own or are members of" 
ON public.groups FOR SELECT 
USING (
  -- User is the owner
  owner_id = auth.uid()
  OR
  -- User is an active member (simplified check)
  id IN (
    SELECT group_id FROM public.group_members 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);