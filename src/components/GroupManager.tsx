import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Users, Plus, MessageCircle, Crown } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import GroupChat from './GroupChat';

const GroupManager: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const { groups, loading, createGroup } = useGroups();
  const { user } = useEnhancedAuth();

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

  const selectedGroupData = groups.find(group => group.id === selectedGroup);

  if (selectedGroup && selectedGroupData) {
    return (
      <div className="h-full">
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => setSelectedGroup(null)}
            className="mb-2"
          >
            ← Back to Groups
          </Button>
        </div>
        <GroupChat
          groupId={selectedGroup}
          groupName={selectedGroupData.name}
        />
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