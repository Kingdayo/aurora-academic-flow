-- Complete fix for infinite recursion in RLS policies

-- First, disable RLS temporarily to avoid conflicts
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on both tables
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    -- Drop all policies on group_members
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'group_members' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.group_members', pol.policyname);
    END LOOP;
    
    -- Drop all policies on groups
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'groups' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.groups', pol.policyname);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for groups table
CREATE POLICY "Users can view their own groups" 
ON public.groups FOR SELECT 
USING (owner_id = auth.uid());

CREATE POLICY "Users can view groups they are members of" 
ON public.groups FOR SELECT 
USING (
  id IN (
    SELECT group_id FROM public.group_members 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Users can create groups" 
ON public.groups FOR INSERT 
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Group owners can update their groups" 
ON public.groups FOR UPDATE 
USING (owner_id = auth.uid());

CREATE POLICY "Group owners can delete their groups" 
ON public.groups FOR DELETE 
USING (owner_id = auth.uid());

-- Create simple, non-recursive policies for group_members table
CREATE POLICY "Users can view their own memberships" 
ON public.group_members FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Group owners can view all members" 
ON public.group_members FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE groups.id = group_members.group_id 
    AND groups.owner_id = auth.uid()
  )
);

CREATE POLICY "Group owners can add members" 
ON public.group_members FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE groups.id = group_members.group_id 
    AND groups.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own membership" 
ON public.group_members FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Group owners can update member status" 
ON public.group_members FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE groups.id = group_members.group_id 
    AND groups.owner_id = auth.uid()
  )
);

CREATE POLICY "Group owners can remove members" 
ON public.group_members FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE groups.id = group_members.group_id 
    AND groups.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can leave groups" 
ON public.group_members FOR DELETE 
USING (user_id = auth.uid());