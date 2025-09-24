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
  join_code: string;
  member_count?: number;
  group_members?: GroupMember[];
}

interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  status: 'pending' | 'active' | 'removed';
  joined_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
    avatar_url?: string | null;
  } | null;
}

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchGroups = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setGroups([]);
        setLoading(false);
        return;
      }

      // Get groups where user is a member
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members!inner(
            user_id,
            role,
            status
          )
        `)
        .eq('group_members.user_id', user.id)
        .eq('group_members.status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError('Failed to fetch groups');
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Generate a unique join code
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await supabase
      .from('groups')
      .insert({
        name,
        description: description || '',
        owner_id: user.id,
        join_code: joinCode
      })
      .select()
      .single();

    if (error) throw error;

    // Add the creator as a member with owner role
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: data.id,
        user_id: user.id,
        role: 'owner',
        status: 'active'
      });

    if (memberError) throw memberError;

    await fetchGroups();
    return data;
  };

  const joinGroup = async (groupId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      throw new Error('You are already a member of this group');
    }

    const { error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: user.id,
        role: 'member',
        status: 'active'
      });

    if (error) throw error;

    await fetchGroups();
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
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const fetchGroupMembers = async (groupId: string): Promise<GroupMember[]> => {
    try {
      // First get the group members
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('status', 'active')
        .order('joined_at', { ascending: true });

      if (membersError) throw membersError;

      if (!members || members.length === 0) {
        return [];
      }

      // Get user IDs
      const userIds = members.map(member => member.user_id);

      // Get profiles for these users (only available columns)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const membersWithProfiles = members.map(member => ({
        ...member,
        profiles: profiles?.find(profile => profile.id === member.user_id) || null
      }));

      return membersWithProfiles;
    } catch (error) {
      console.error('Error fetching group members:', error);
      return [];
    }
  };

  const addMemberToGroup = async (groupId: string, userEmail: string) => {
    try {
      // First, find the user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userEmail.trim())
        .single();

      if (userError || !userData) {
        throw new Error('User not found with this email');
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userData.id)
        .single();

      if (existingMember) {
        throw new Error('User is already a member of this group');
      }

      // Add the user to the group
      const { error: addError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userData.id,
          status: 'active',
          role: 'member'
        });

      if (addError) throw addError;

      return { success: true };
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  };

  const removeMemberFromGroup = async (groupId: string, memberId: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  };

  const getGroupMembers = async (groupId: string) => {
    try {
      // First get the group members
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('status', 'active');

      if (membersError) throw membersError;

      if (!members || members.length === 0) {
        return [];
      }

      // Get user IDs
      const userIds = members.map(member => member.user_id);

      // Get profiles for these users (only available columns)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const membersWithProfiles = members.map(member => ({
        ...member,
        profiles: profiles?.find(profile => profile.id === member.user_id) || null
      }));

      return membersWithProfiles;
    } catch (error) {
      console.error('Error loading members:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return {
    groups,
    loading,
    error,
    createGroup,
    joinGroup,
    leaveGroup,
    addMemberToGroup,
    removeMemberFromGroup,
    getGroupMembers,
    refetch: fetchGroups
  };
};