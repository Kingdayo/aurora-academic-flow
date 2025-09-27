import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedAuth } from './useEnhancedAuth';
import { toast } from 'sonner';

interface Group {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  join_code: string;
  created_at: string;
  group_members?: any[];
}

export function useGroups() {
  const { user } = useEnhancedAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get groups where user is owner or member
      const { data: userGroups, error: userGroupsError } = await supabase
        .from('group_members')
        .select(`
          group_id,
          groups (
            id,
            name,
            description,
            owner_id,
            join_code,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (userGroupsError) throw userGroupsError;

      // Get groups where user is owner (in case they're not in group_members)
      const { data: ownedGroups, error: ownedGroupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('owner_id', user.id);

      if (ownedGroupsError) throw ownedGroupsError;

      // Combine and deduplicate groups
      const allGroupsMap = new Map<string, Group>();
      
      userGroups?.forEach(item => {
        if (item.groups) {
          allGroupsMap.set(item.groups.id, item.groups as Group);
        }
      });

      ownedGroups?.forEach(group => {
        allGroupsMap.set(group.id, group);
      });

      const allGroups = Array.from(allGroupsMap.values());

      setGroups(allGroups);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createGroup = async (name: string, description?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      // Generate a unique join code
      const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: name.trim(),
          description: description?.trim(),
          owner_id: user.id,
          join_code: joinCode,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add the creator as a member with owner role
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'owner',
          status: 'active',
        });

      if (memberError) throw memberError;

      await fetchGroups();
      return group;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Check if user is already a member
      const { data: existingMember, error: checkError } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingMember) {
        toast.info('You are already a member of this group');
        return;
      }

      // Add user as member
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member',
          status: 'active',
        });

      if (joinError) throw joinError;

      await fetchGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      throw error;
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Check if user is the owner
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('owner_id')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;

      if (group.owner_id === user.id) {
        toast.error('Group owners cannot leave their own group. Delete the group instead.');
        return;
      }

      // Remove user from group
      const { error: leaveError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (leaveError) throw leaveError;

      await fetchGroups();
      toast.success('Left group successfully');
    } catch (error) {
      console.error('Error leaving group:', error);
      throw error;
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Verify user is the owner
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('owner_id')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;

      if (group.owner_id !== user.id) {
        throw new Error('Only group owners can delete groups');
      }

      // Delete the group (cascade will handle members and messages)
      const { error: deleteError } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (deleteError) throw deleteError;

      await fetchGroups();
      toast.success('Group deleted successfully');
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Set up real-time subscriptions for group changes
  useEffect(() => {
    if (!user) return;

    const groupsChannel = supabase
      .channel('groups_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups',
        },
        () => {
          fetchGroups();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
        },
        () => {
          fetchGroups();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(groupsChannel);
    };
  }, [user, fetchGroups]);

  return {
    groups,
    loading,
    createGroup,
    joinGroup,
    leaveGroup,
    deleteGroup,
    refetch: fetchGroups,
  };
}