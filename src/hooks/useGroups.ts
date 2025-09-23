import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Group {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  status: 'pending' | 'active' | 'removed';
  joined_at: string;
  profile?: {
    full_name: string | null;
  };
}

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members!inner(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const groupsWithCount = data?.map(group => ({
        ...group,
        member_count: group.group_members?.[0]?.count || 0
      })) || [];

      setGroups(groupsWithCount);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Error",
        description: "Failed to fetch groups",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (name: string, description?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert([{ name, description, owner_id: user.id }])
        .select()
        .single();

      if (groupError) throw groupError;

      // Add the creator as an owner member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert([{
          group_id: group.id,
          user_id: user.id,
          role: 'owner',
          status: 'active'
        }]);

      if (memberError) throw memberError;

      toast({
        title: "Success",
        description: `Group "${name}" created successfully`,
      });

      fetchGroups();
      return { data: group, error: null };
    } catch (error) {
      console.error('Error creating group:', error);
      const message = error instanceof Error ? error.message : 'Failed to create group';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const joinGroup = async (groupId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('group_members')
        .insert([{
          group_id: groupId,
          user_id: user.id,
          role: 'member',
          status: 'active'
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Joined group successfully",
      });

      fetchGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      const message = error instanceof Error ? error.message : 'Failed to join group';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const leaveGroup = async (groupId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('group_members')
        .update({ status: 'removed' })
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Left group successfully",
      });

      fetchGroups();
    } catch (error) {
      console.error('Error leaving group:', error);
      const message = error instanceof Error ? error.message : 'Failed to leave group';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const fetchGroupMembers = async (groupId: string): Promise<GroupMember[]> => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('group_id', groupId)
        .eq('status', 'active')
        .order('joined_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching group members:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return {
    groups,
    loading,
    createGroup,
    joinGroup,
    leaveGroup,
    fetchGroups,
    fetchGroupMembers,
  };
};