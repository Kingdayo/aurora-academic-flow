import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useGroups } from '@/hooks/useGroups';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Crown, Users, Mail, UserPlus, Trash2, Copy, MessageCircle } from 'lucide-react';

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
    } catch (error) {
      toast.error('Failed to join group');
    } finally {
      setIsJoining(false);
    }
  };

  const loadGroupMembers = async (groupId: string) => {
    setLoadingMembers(true);
    try {
      // First get the group members
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('status', 'active');

      if (membersError) throw membersError;

      if (!members || members.length === 0) {
        setGroupMembers([]);
        return;
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

      setGroupMembers(membersWithProfiles);
    } catch (error) {
      console.error('Error loading members:', error);
      toast.error('Failed to load group members');
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
  const userGroups = groups.filter(group => 
    group.owner_id === user?.id || 
    group.group_members?.some((member: any) => member.user_id === user?.id)
  );

  if (loading) {
    return <div className="flex justify-center p-8">Loading groups...</div>;
  }

  return (
    <div className="space-y-6 bg-white min-h-screen p-4 md:p-6">
      {/* Your Groups Section - Moved to top */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Groups ({userGroups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userGroups.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No groups yet. Create or join a group to get started!
            </p>
          ) : (
            <div className="space-y-4">
              {userGroups.map((group) => (
                <div key={group.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`} />
                        <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold flex items-center gap-2 flex-wrap">
                          {group.name}
                          {isGroupAdmin(group) && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">{group.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {group.group_members?.filter((m: any) => m.status === 'active').length || 0} members
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {isGroupAdmin(group) && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Admin
                        </Badge>
                      )}
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onGroupSelect?.(group.id)}
                        className="flex items-center gap-1"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Open Chat
                      </Button>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-gray-600">Join Code:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {group.join_code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyJoinCode(group.join_code)}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
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
                            >
                              <Users className="h-4 w-4 mr-1" />
                              Manage Members
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden">
                            <DialogHeader>
                              <DialogTitle>Manage Group Members</DialogTitle>
                              <DialogDescription>
                                View and manage members of this group ({groupMembers.length} total).
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              {loadingMembers ? (
                                <div className="text-center py-4">Loading members...</div>
                              ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                  {groupMembers.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                          <AvatarImage 
                                            src={member.profiles?.avatar_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`}
                                            alt={member.profiles?.full_name || 'Member'} 
                                          />
                                          <AvatarFallback>
                                            {member.profiles?.full_name?.charAt(0) || 'M'}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">
                                          {member.profiles?.full_name || 'Unknown User'}
                                          {member.role === 'owner' && (
                                            <Crown className="h-3 w-3 text-yellow-500 inline ml-1" />
                                          )}
                                        </span>
                                      </div>
                                      {member.role !== 'owner' && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemoveMember(group.id, member.id)}
                                          className="text-red-600 hover:text-red-700"
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
                          className="text-red-600 hover:text-red-700"
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Group
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <Textarea
            placeholder="Group description (optional)"
            value={newGroupDescription}
            onChange={(e) => setNewGroupDescription(e.target.value)}
          />
          <Button 
            onClick={handleCreateGroup} 
            disabled={isCreating || !newGroupName.trim()}
            className="w-full"
          >
            {isCreating ? 'Creating...' : 'Create Group'}
          </Button>
        </CardContent>
      </Card>

      {/* Join Group Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Join Group
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Group Join Code</Label>
            <Input
              placeholder="Enter 6-digit join code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="text-center font-mono text-lg tracking-wider"
              maxLength={6}
            />
            <p className="text-xs text-muted-foreground text-center">
              Ask the group admin for the join code
            </p>
          </div>
          <Button 
            onClick={handleJoinGroup} 
            disabled={isJoining || !joinCode.trim()}
            className="w-full"
            size="lg"
          >
            {isJoining ? 'Joining...' : 'Join Group'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}