-- Create groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group_members table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'task_update')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups
CREATE POLICY "Users can view groups they are members of" 
ON public.groups FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = groups.id 
    AND user_id = auth.uid() 
    AND status = 'active'
  )
);

CREATE POLICY "Users can create groups" 
ON public.groups FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Group owners can update their groups" 
ON public.groups FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Group owners can delete their groups" 
ON public.groups FOR DELETE 
USING (auth.uid() = owner_id);

-- RLS Policies for group_members
CREATE POLICY "Users can view members of groups they belong to" 
ON public.group_members FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm2 
    WHERE gm2.group_id = group_members.group_id 
    AND gm2.user_id = auth.uid() 
    AND gm2.status = 'active'
  )
);

CREATE POLICY "Group owners and admins can manage members" 
ON public.group_members FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = group_members.group_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
    AND status = 'active'
  )
);

CREATE POLICY "Group owners and admins can update members" 
ON public.group_members FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = group_members.group_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
    AND status = 'active'
  )
);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in groups they belong to" 
ON public.messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = messages.group_id 
    AND user_id = auth.uid() 
    AND status = 'active'
  )
);

CREATE POLICY "Users can create messages in groups they belong to" 
ON public.messages FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = messages.group_id 
    AND user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Add indexes for performance
CREATE INDEX idx_group_members_group_user ON public.group_members(group_id, user_id);
CREATE INDEX idx_group_members_user ON public.group_members(user_id);
CREATE INDEX idx_messages_group_created ON public.messages(group_id, created_at DESC);
CREATE INDEX idx_messages_user ON public.messages(user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_groups_updated_at
BEFORE UPDATE ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_group_members_updated_at
BEFORE UPDATE ON public.group_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;