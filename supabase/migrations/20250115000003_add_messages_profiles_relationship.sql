-- Add foreign key relationship between messages and profiles tables

-- First, ensure the profiles table exists and has the correct structure
-- (This should already exist, but we'll make sure)

-- Add foreign key constraint from messages.user_id to profiles.id
ALTER TABLE public.messages 
ADD CONSTRAINT messages_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Create index for better performance on joins
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);

-- Add RLS policies for messages table if they don't exist
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON public.messages;

-- Create new policies for messages
CREATE POLICY "messages_select_policy" ON public.messages
FOR SELECT USING (
  -- Users can see messages in groups they are members of
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_members.group_id = messages.group_id 
    AND group_members.user_id = auth.uid()
    AND group_members.status = 'active'
  )
  OR
  -- Group owners can see all messages in their groups
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE groups.id = messages.group_id 
    AND groups.owner_id = auth.uid()
  )
);

CREATE POLICY "messages_insert_policy" ON public.messages
FOR INSERT WITH CHECK (
  -- Users can only insert messages if they are members of the group
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_members.group_id = messages.group_id 
    AND group_members.user_id = auth.uid()
    AND group_members.status = 'active'
  )
  AND user_id = auth.uid()
);

CREATE POLICY "messages_update_policy" ON public.messages
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "messages_delete_policy" ON public.messages
FOR DELETE USING (
  user_id = auth.uid() 
  OR 
  -- Group owners can delete any message in their groups
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE groups.id = messages.group_id 
    AND groups.owner_id = auth.uid()
  )
);