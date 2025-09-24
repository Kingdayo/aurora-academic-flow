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
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

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

  const addMemberByEmail = async (email: string) => {
    if (!selectedGroup) return;
    
    setIsAddingMember(true);
    try {
      // Get user by email from auth.users (this requires RLS policy or admin access)
      // Since we can't directly query auth.users, we'll need to use a different approach
      // Let's try to find the user by creating a temporary invitation or using a function
      
      // For now, let's show an error that we need the user ID directly
      toast.error('Please ask the user to share their User ID instead of email for now');
      
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    } finally {
      setIsAddingMember(false);
    }
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
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Add Member</DialogTitle>
                              <DialogDescription>
                                Add a new member to the group by entering their email address.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="member-email">Email Address</Label>
                                <Input
                                  id="member-email"
                                  type="email"
                                  placeholder="Enter member's email"
                                  value={newMemberEmail}
                                  onChange={(e) => setNewMemberEmail(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      addMemberByEmail(newMemberEmail);
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsAddMemberOpen(false);
                                  setNewMemberEmail('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => addMemberByEmail(newMemberEmail)}
                                disabled={!newMemberEmail.trim() || isAddingMember}
                              >
                                {isAddingMember ? 'Adding...' : 'Add Member'}
                              </Button>
                            </DialogFooter>
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