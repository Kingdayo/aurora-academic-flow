-- Force reset all RLS policies to eliminate infinite recursion

-- Completely disable RLS and drop all policies
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;

-- Force drop all policies with CASCADE
DROP POLICY IF EXISTS "Users can view their own groups" ON public.groups CASCADE;
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups CASCADE;
DROP POLICY IF EXISTS "Users can create groups" ON public.groups CASCADE;
DROP POLICY IF EXISTS "Group owners can update their groups" ON public.groups CASCADE;
DROP POLICY IF EXISTS "Group owners can delete their groups" ON public.groups CASCADE;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.group_members CASCADE;
DROP POLICY IF EXISTS "Group owners can view all members" ON public.group_members CASCADE;
DROP POLICY IF EXISTS "Group owners can add members" ON public.group_members CASCADE;
DROP POLICY IF EXISTS "Users can update their own membership" ON public.group_members CASCADE;
DROP POLICY IF EXISTS "Group owners can update member status" ON public.group_members CASCADE;
DROP POLICY IF EXISTS "Group owners can remove members" ON public.group_members CASCADE;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members CASCADE;

-- Drop any other potential policies
DROP POLICY IF EXISTS "Enable read access for group members" ON public.groups CASCADE;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.groups CASCADE;
DROP POLICY IF EXISTS "Enable update for group owners" ON public.groups CASCADE;
DROP POLICY IF EXISTS "Enable delete for group owners" ON public.groups CASCADE;
DROP POLICY IF EXISTS "Enable read access for group members" ON public.group_members CASCADE;
DROP POLICY IF EXISTS "Enable insert for group owners" ON public.group_members CASCADE;
DROP POLICY IF EXISTS "Enable update for group owners and members" ON public.group_members CASCADE;
DROP POLICY IF EXISTS "Enable delete for group owners and members" ON public.group_members CASCADE;

-- Re-enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Create completely new, simple policies

-- GROUPS table policies (no references to group_members)
CREATE POLICY "groups_select_owner" ON public.groups
FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "groups_insert_owner" ON public.groups
FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "groups_update_owner" ON public.groups
FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "groups_delete_owner" ON public.groups
FOR DELETE USING (owner_id = auth.uid());

-- GROUP_MEMBERS table policies (minimal references to groups)
CREATE POLICY "group_members_select_own" ON public.group_members
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "group_members_insert_check" ON public.group_members
FOR INSERT WITH CHECK (
  -- Only allow if the current user owns the group
  (SELECT owner_id FROM public.groups WHERE id = group_id) = auth.uid()
);

CREATE POLICY "group_members_update_own" ON public.group_members
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "group_members_delete_own" ON public.group_members
FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "group_members_delete_owner" ON public.group_members
FOR DELETE USING (
  -- Allow group owner to remove members
  (SELECT owner_id FROM public.groups WHERE id = group_id) = auth.uid()
);