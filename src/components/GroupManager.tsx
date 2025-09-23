import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useGroups } from '@/hooks/useGroups';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Crown, Users, Mail, UserPlus, Trash2 } from 'lucide-react';

interface GroupManagerProps {
  onGroupSelect?: (groupId: string) => void;
}

// Generate distinct avatar based on user ID and role
const generateAvatar = (userId: string, isAdmin: boolean = false) => {
  const seed = userId || 'default';
  const baseUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  
  if (isAdmin) {
    // Admin avatars have crown accessories and special styling
    return `${baseUrl}&accessories=prescription02&clothingColor=262e33&eyebrowType=raisedexcited&eyeType=happy&facialHairColor=auburn&facialHairType=beardmedium&hairColor=auburn&hatColor=blue03&mouthType=smile&skinColor=light&topType=shortHairShortCurly`;
  } else {
    // Regular user avatars with varied but consistent styling
    return `${baseUrl}&clothingColor=3c4f5c&eyeType=default&mouthType=default&skinColor=tanned`;
  }
};

export default function GroupManager({ onGroupSelect }: GroupManagerProps) {
  const { user } = useEnhancedAuth();
  const { groups, loading, createGroup, joinGroup, leaveGroup, refetch } = useGroups();
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [memberEmail, setMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
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
      await joinGroup(joinCode);
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
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          profiles:user_id (
            id,
            email,
            full_name
          )
        `)
        .eq('group_id', groupId)
        .eq('status', 'active');

      if (error) throw error;
      setGroupMembers(data || []);
    } catch (error) {
      console.error('Error loading members:', error);
      toast.error('Failed to load group members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAddMember = async (groupId: string) => {
    if (!memberEmail.trim()) return;
    
    setIsAddingMember(true);
    try {
      // First, find the user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', memberEmail.trim())
        .single();

      if (userError || !userData) {
        toast.error('User not found with this email');
        return;
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userData.id)
        .single();

      if (existingMember) {
        toast.error('User is already a member of this group');
        return;
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

      setMemberEmail('');
      toast.success('Member added successfully!');
      loadGroupMembers(groupId); // Reload members
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    } finally {
      setIsAddingMember(false);
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

  if (loading) {
    return <div className="flex justify-center p-8">Loading groups...</div>;
  }

  return (
    <div className="space-y-6 bg-white min-h-screen p-6">
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
          <Input
            placeholder="Enter group join code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
          />
          <Button 
            onClick={handleJoinGroup} 
            disabled={isJoining || !joinCode.trim()}
            className="w-full"
          >
            {isJoining ? 'Joining...' : 'Join Group'}
          </Button>
        </CardContent>
      </Card>

      {/* Groups List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Groups ({groups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No groups yet. Create or join a group to get started!
            </p>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={generateAvatar(group.id)} />
                        <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          {group.name}
                          {isGroupAdmin(group) && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">{group.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isGroupAdmin(group) && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Admin
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onGroupSelect?.(group.id)}
                      >
                        Open Chat
                      </Button>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Join Code:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {group.join_code}
                      </code>
                    </div>

                    <div className="flex items-center gap-2">
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
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Manage Group Members</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              {/* Add Member Section */}
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Add Member by Email</label>
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Enter user email"
                                    value={memberEmail}
                                    onChange={(e) => setMemberEmail(e.target.value)}
                                    type="email"
                                  />
                                  <Button
                                    onClick={() => handleAddMember(group.id)}
                                    disabled={isAddingMember || !memberEmail.trim()}
                                    size="sm"
                                  >
                                    {isAddingMember ? 'Adding...' : 'Add'}
                                  </Button>
                                </div>
                              </div>

                              <Separator />

                              {/* Members List */}
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Current Members</label>
                                {loadingMembers ? (
                                  <p className="text-sm text-gray-500">Loading members...</p>
                                ) : (
                                  <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {groupMembers.map((member) => (
                                      <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-8 w-8">
                                            <AvatarImage 
                                              src={generateAvatar(member.user_id, member.user_id === group.owner_id)} 
                                            />
                                            <AvatarFallback>
                                              {member.profiles?.full_name?.charAt(0) || member.profiles?.email?.charAt(0) || 'U'}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <p className="text-sm font-medium flex items-center gap-1">
                                              {member.profiles?.full_name || member.profiles?.email}
                                              {member.user_id === group.owner_id && (
                                                <Crown className="h-3 w-3 text-yellow-500" />
                                              )}
                                            </p>
                                            <p className="text-xs text-gray-500">{member.profiles?.email}</p>
                                          </div>
                                        </div>
                                        {member.user_id !== group.owner_id && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveMember(group.id, member.id)}
                                            className="text-red-600 hover:text-red-700"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
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
    </div>
  );
}