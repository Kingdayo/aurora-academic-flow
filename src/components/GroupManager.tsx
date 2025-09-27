import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useGroups } from '@/hooks/useGroups';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Crown, Users, UserPlus, Trash2, Copy, MessageCircle } from 'lucide-react';
import { generateAvatarUrl } from '@/lib/utils';

interface GroupManagerProps {
  onGroupSelect?: (groupId: string) => void;
}

export default function GroupManager({ onGroupSelect }: GroupManagerProps) {
  const { user } = useEnhancedAuth();
  const { groups, loading, createGroup, joinGroup, leaveGroup, refetch } = useGroups();
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});

  // Real-time member count updates
  useEffect(() => {
    const channel = supabase
      .channel('group_members_count_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
        },
        () => {
          // Refetch all counts on any change
          if (groups.length > 0) {
            const loadMemberCounts = async () => {
              const counts: Record<string, number> = {};
              for (const group of groups) {
                try {
                  const { count, error } = await supabase
                    .from('group_members')
                    .select('id', { count: 'exact' })
                    .eq('group_id', group.id)
                    .eq('status', 'active');

                  if (!error && count !== null) {
                    counts[group.id] = count;
                  }
                } catch (error) {
                  // silent fail
                }
              }
              setMemberCounts(counts);
            };
            loadMemberCounts();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groups]);

  // Load member counts for all groups
  useEffect(() => {
    const loadMemberCounts = async () => {
      if (groups.length === 0) return;
      
      const counts: Record<string, number> = {};
      
      for (const group of groups) {
        try {
          const { count, error } = await supabase
            .from('group_members')
            .select('id', { count: 'exact' })
            .eq('group_id', group.id)
            .eq('status', 'active');
          
          if (!error && count !== null) {
            counts[group.id] = count;
          }
        } catch (error) {
          console.error('Error loading member count for group:', group.id, error);
        }
      }
      
      setMemberCounts(counts);
    };

    loadMemberCounts();
  }, [groups]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    
    setIsCreating(true);
    try {
      await createGroup(newGroupName, newGroupDescription);
      setNewGroupName('');
      setNewGroupDescription('');
      toast.success('Group created successfully!');
    } catch (error) {
      toast.error('Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) return;
    
    setIsJoining(true);
    try {
      // Find group by join code
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('id')
        .eq('join_code', joinCode.trim())
        .single();

      if (groupError || !groupData) {
        toast.error('Invalid join code');
        return;
      }

      await joinGroup(groupData.id);
      setJoinCode('');
      toast.success('Joined group successfully!');
      
      // Refresh member counts after joining
      refetch();
    } catch (error) {
      toast.error('Failed to join group');
    } finally {
      setIsJoining(false);
    }
  };

  const loadGroupMembers = async (groupId: string) => {
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase.rpc('get_group_members_with_profiles', {
        p_group_id: groupId
      });

      if (error) throw error;

      const membersWithProfiles = data.map(member => ({
        ...member,
        profiles: {
          full_name: member.full_name,
          avatar_url: member.avatar_url,
        }
      }));

      setGroupMembers(membersWithProfiles);
    } catch (error) {
      console.error('Error loading members:', error);
      toast.error('Failed to load group members. You must be an admin to view members.');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleRemoveMember = async (groupId: string, memberId: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Member removed successfully!');
      loadGroupMembers(groupId); // Reload members
      refetch(); // Refresh groups to update member counts
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const isGroupAdmin = (group: any) => {
    return group.owner_id === user?.id;
  };

  const copyJoinCode = (joinCode: string) => {
    navigator.clipboard.writeText(joinCode);
    toast.success('Join code copied to clipboard!');
  };

  // Separate user's groups from other groups
  const userGroups = groups.filter(
    group =>
      group.owner_id === user?.id ||
      group.group_members?.some((member: any) => member.user_id === user?.id)
  );

  if (loading) {
    return <div className="flex justify-center p-8 bg-background">Loading groups...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6 bg-background min-h-screen p-3 md:p-6">
      {/* Your Groups Section - Moved to top */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Users className="h-4 w-4 md:h-5 md:w-5" />
            Your Groups ({userGroups.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {userGroups.length === 0 ? (
            <p className="text-muted-foreground text-center py-6 md:py-8 text-sm md:text-base">
              No groups yet. Create or join a group to get started!
            </p>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {userGroups.map((group) => (
                <div key={group.id} className="border rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow bg-card">
                  <div className="flex flex-col gap-3 mb-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                        <AvatarImage src={generateAvatarUrl(group.id)} />
                        <AvatarFallback className="text-xs md:text-sm">{group.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-sm md:text-base truncate">
                            {group.name}
                          </h3>
                          {isGroupAdmin(group) && (
                            <Crown className="h-3 w-3 md:h-4 md:w-4 text-yellow-500 flex-shrink-0" />
                          )}
                          {isGroupAdmin(group) && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5">
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{group.description}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {memberCounts[group.id] || 0} members
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onGroupSelect?.(group.id)}
                        className="flex items-center gap-1 text-xs md:text-sm h-8 md:h-9"
                      >
                        <MessageCircle className="h-3 w-3 md:h-4 md:w-4" />
                        Open Chat
                      </Button>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="text-xs md:text-sm text-muted-foreground flex-shrink-0">Join Code:</span>
                      <div className="flex items-center gap-2 flex-1">
                        <code className="bg-muted px-2 py-1 rounded text-xs md:text-sm font-mono flex-1 min-w-0 truncate">
                          {group.join_code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyJoinCode(group.join_code)}
                          className="h-7 w-7 md:h-8 md:w-8 p-0 flex-shrink-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      {/* Manage Members - Only for Admins */}
                      {isGroupAdmin(group) && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedGroup(group.id);
                                loadGroupMembers(group.id);
                              }}
                              className="text-xs md:text-sm h-8 md:h-9"
                            >
                              <Users className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                              Manage Members
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="w-[95vw] max-w-md mx-auto">
                            <DialogHeader>
                              <DialogTitle className="text-base md:text-lg">Manage Group Members</DialogTitle>
                              <DialogDescription className="text-sm">
                                View and manage members of this group.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              {loadingMembers ? (
                                <div className="text-center py-4 text-sm">Loading members...</div>
                              ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                  {groupMembers.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between p-2 border rounded bg-card">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <Avatar className="h-6 w-6 flex-shrink-0">
                                          <AvatarImage
                                            src={member.profiles?.avatar_url || generateAvatarUrl(member.user_id)}
                                            alt={member.profiles?.full_name || 'Member'}
                                          />
                                          <AvatarFallback className="text-xs">
                                            {member.profiles?.full_name?.charAt(0) || 'M'}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1">
                                            <span className="text-sm truncate">
                                              {member.profiles?.full_name || 'Unknown User'}
                                            </span>
                                            {member.role === 'owner' && (
                                              <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                                            )}
                                          </div>
                                          <span className="text-xs text-muted-foreground capitalize">{member.role}</span>
                                        </div>
                                      </div>
                                      {member.role !== 'owner' && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemoveMember(group.id, member.id)}
                                          className="text-red-600 hover:text-red-700 h-8 w-8 p-0 flex-shrink-0"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      {!isGroupAdmin(group) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => leaveGroup(group.id)}
                          className="text-red-600 hover:text-red-700 text-xs md:text-sm h-8 md:h-9"
                        >
                          Leave Group
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Group Section */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Plus className="h-4 w-4 md:h-5 md:w-5" />
            Create New Group
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4 pt-0">
          <Input
            placeholder="Group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            className="text-sm md:text-base"
          />
          <Textarea
            placeholder="Group description (optional)"
            value={newGroupDescription}
            onChange={(e) => setNewGroupDescription(e.target.value)}
            className="text-sm md:text-base min-h-[80px]"
          />
          <Button
            onClick={handleCreateGroup}
            disabled={isCreating || !newGroupName.trim()}
            className="w-full text-sm md:text-base h-9 md:h-10"
          >
            {isCreating ? 'Creating...' : 'Create Group'}
          </Button>
        </CardContent>
      </Card>

      {/* Join Group Section */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <UserPlus className="h-4 w-4 md:h-5 md:w-5" />
            Join Group
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4 pt-0">
          <Input
            placeholder="Enter join code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="text-sm md:text-base"
          />
          <Button
            onClick={handleJoinGroup}
            disabled={isJoining || !joinCode.trim()}
            className="w-full text-sm md:text-base h-9 md:h-10"
          >
            {isJoining ? 'Joining...' : 'Join Group'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}