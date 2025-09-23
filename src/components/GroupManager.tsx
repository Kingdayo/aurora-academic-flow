import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Plus, MessageCircle, Crown, UserPlus, Search, X } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import GroupChat from './GroupChat';

const GroupManager: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const { groups, loading, createGroup, fetchGroupMembers } = useGroups();
  const { user } = useEnhancedAuth();
  const { toast } = useToast();

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const { error } = await createGroup(newGroupName.trim(), newGroupDescription.trim() || undefined);
    
    if (!error) {
      setNewGroupName('');
      setNewGroupDescription('');
      setShowCreateDialog(false);
    }
  };

  const searchUserByEmail = async (email: string) => {
    if (!email.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .ilike('email', `%${email}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const addMemberToGroup = async (userId: string, userEmail: string) => {
    if (!selectedGroup) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .insert([{
          group_id: selectedGroup,
          user_id: userId,
          role: 'member',
          status: 'active'
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Added ${userEmail} to the group`,
      });

      setSearchEmail('');
      setSearchResults([]);
      loadGroupMembers(selectedGroup);
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: "Error",
        description: "Failed to add member to group",
        variant: "destructive",
      });
    }
  };

  const loadGroupMembers = async (groupId: string) => {
    const members = await fetchGroupMembers(groupId);
    setGroupMembers(members);
  };

  const removeMemberFromGroup = async (memberId: string, memberName: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ status: 'removed' })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Removed ${memberName} from the group`,
      });

      if (selectedGroup) {
        loadGroupMembers(selectedGroup);
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  const getAvatarColor = (userId: string, isOwner: boolean) => {
    if (isOwner) {
      return 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-2 border-yellow-300 shadow-lg';
    }
    
    // Generate distinct colors based on user ID
    const colors = [
      'bg-blue-500 text-white',
      'bg-green-500 text-white',
      'bg-purple-500 text-white',
      'bg-pink-500 text-white',
      'bg-indigo-500 text-white',
      'bg-red-500 text-white',
      'bg-teal-500 text-white',
      'bg-orange-500 text-white',
    ];
    
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  React.useEffect(() => {
    if (selectedGroup) {
      loadGroupMembers(selectedGroup);
    }
  }, [selectedGroup]);

  const selectedGroupData = groups.find(group => group.id === selectedGroup);
  const isGroupOwner = selectedGroupData?.owner_id === user?.id;

  if (selectedGroup && selectedGroupData) {
    return (
      <div className="h-full flex">
        <div className="w-80 border-r bg-muted/30 p-4 space-y-4">
          <Button
            variant="outline"
            onClick={() => setSelectedGroup(null)}
            className="w-full"
          >
            ← Back to Groups
          </Button>
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Members ({groupMembers.length})</h3>
              {isGroupOwner && (
                <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Member to Group</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="searchEmail">Search by Email</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="searchEmail"
                            value={searchEmail}
                            onChange={(e) => {
                              setSearchEmail(e.target.value);
                              searchUserByEmail(e.target.value);
                            }}
                            placeholder="Enter user email..."
                            className="pl-10"
                          />
                        </div>
                      </div>
                      
                      {searching && (
                        <div className="text-center text-muted-foreground">
                          Searching...
                        </div>
                      )}
                      
                      {searchResults.length > 0 && (
                        <div className="space-y-2">
                          <Label>Search Results</Label>
                          {searchResults.map((result) => (
                            <div key={result.id} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center gap-2">
                                <Avatar className={`h-8 w-8 ${getAvatarColor(result.id, false)}`}>
                                  <AvatarFallback>
                                    {getInitials(result.full_name || result.email)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{result.full_name || 'Unknown'}</div>
                                  <div className="text-sm text-muted-foreground">{result.email}</div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => addMemberToGroup(result.id, result.email)}
                                disabled={groupMembers.some(member => member.user_id === result.id)}
                              >
                                {groupMembers.some(member => member.user_id === result.id) ? 'Already Added' : 'Add'}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            
            <div className="space-y-2">
              {groupMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-background">
                  <div className="flex items-center gap-2">
                    <Avatar className={`h-8 w-8 ${getAvatarColor(member.user_id, member.role === 'owner')}`}>
                      <AvatarFallback>
                        {getInitials(member.profile?.full_name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        {member.profile?.full_name || 'Unknown User'}
                        {member.role === 'owner' && <Crown className="h-3 w-3 text-yellow-500" />}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">{member.role}</div>
                    </div>
                  </div>
                  {isGroupOwner && member.role !== 'owner' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeMemberFromGroup(member.id, member.profile?.full_name || 'User')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex-1">
          <GroupChat
            groupId={selectedGroup}
            groupName={selectedGroupData.name}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Groups</h2>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <Label htmlFor="groupDescription">Description (optional)</Label>
                <Textarea
                  id="groupDescription"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Enter group description..."
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!newGroupName.trim()}>
                  Create Group
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading groups...</div>
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Groups Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first group to start collaborating with others.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Group
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <Card key={group.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {group.name}
                  </CardTitle>
                  {group.owner_id === user?.id && (
                    <Crown className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
                {group.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {group.description}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {group.member_count || 0} members
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => setSelectedGroup(group.id)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Open Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupManager;