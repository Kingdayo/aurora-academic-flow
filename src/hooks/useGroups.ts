import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedAuth } from './useEnhancedAuth';
import { toast } from 'sonner';

export const useGroups = () => {
  const { user } = useEnhancedAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get groups where user is owner or member
      const { data: memberGroups, error: memberError } = await supabase
        .from('group_members')
        .select(`
          group_id,
          groups!inner (
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

      if (memberError) throw memberError;

      // Get groups where user is owner
      const { data: ownedGroups, error: ownedError } = await supabase
        .from('groups')
        .select('*')
        .eq('owner_id', user.id);

      if (ownedError) throw ownedError;

      // Combine and deduplicate groups
      const allGroups = new Map();
      
      // Add owned groups
      ownedGroups?.forEach(group => {
        allGroups.set(group.id, group);
      });

      // Add member groups
      memberGroups?.forEach(memberGroup => {
        const group = memberGroup.groups;
        if (group && !allGroups.has(group.id)) {
          allGroups.set(group.id, group);
        }
      });

      // For each group, get member information
      const groupsWithMembers = await Promise.all(
        Array.from(allGroups.values()).map(async (group) => {
          try {
            const { data: members, error: membersError } = await supabase
              .from('group_members')
              .select('*')
              .eq('group_id', group.id)
              .eq('status', 'active');

            if (membersError) {
              console.error('Error fetching members for group:', group.id, membersError);
              return { ...group, group_members: [] };
            }

            return { ...group, group_members: members || [] };
          } catch (error) {
            console.error('Error processing group:', group.id, error);
            return { ...group, group_members: [] };
          }
        })
      );

      setGroups(groupsWithMembers);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (name: string, description?: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Generate a unique 6-character join code
      const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name,
          description: description || '',
          owner_id: user.id,
          join_code: joinCode,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add the creator as the first member with owner role
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
        toast.error('Group owners cannot leave their own groups. Delete the group instead.');
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

  useEffect(() => {
    fetchGroups();
  }, [user]);

  return {
    groups,
    loading,
    createGroup,
    joinGroup,
    leaveGroup,
    refetch: fetchGroups,
  };
};