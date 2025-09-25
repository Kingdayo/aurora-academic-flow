import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Send, ArrowLeft, Users, Crown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { generateAvatarUrl } from '@/lib/utils';

interface GroupChatProps {
  groupId: string;
  onBack?: () => void;
}

export default function GroupChat({ groupId, onBack }: GroupChatProps) {
  const { user } = useEnhancedAuth();
  const { messages, loading, sendMessage } = useRealtimeMessages(groupId);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadGroupInfo();
    loadGroupMembers();
  }, [groupId]);

  const loadGroupInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (error) throw error;
      setGroupInfo(data);
    } catch (error) {
      console.error('Error loading group info:', error);
    }
  };

  const loadGroupMembers = async () => {
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

      // Get profiles for these users
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
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage(newMessage.trim());
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const isGroupAdmin = (userId: string) => {
    return groupInfo?.owner_id === userId;
  };

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  if (loading && !messages.length) {
    return (
      <div className="flex justify-center items-center h-96 bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <Card className="rounded-none border-x-0 border-t-0 bg-background">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="md:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-10 w-10">
                <AvatarImage src={generateAvatarUrl(groupId)} />
                <AvatarFallback>{groupInfo?.name?.charAt(0) || 'G'}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{groupInfo?.name || 'Group Chat'}</CardTitle>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {groupMembers.length} members
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="hidden md:flex"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Groups
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-2 sm:px-4 py-2">
          <div className="space-y-3 sm:space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-2">
                  <Users className="h-12 w-12 mx-auto mb-4" />
                </div>
                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.user_id === user?.id;
                const displayName = isOwnMessage ? 'You' : (message.profiles?.full_name || 'User');
                
                return (
                  <div
                    key={message.id}
                    className={`flex gap-2 sm:gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 mt-1">
                      <AvatarImage 
                        src={generateAvatarUrl(message.user_id)}
                        alt={displayName} 
                      />
                      <AvatarFallback className="text-xs">
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 max-w-[280px] sm:max-w-sm md:max-w-md lg:max-w-lg ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                      <div className={`flex items-center gap-1 sm:gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-xs sm:text-sm font-medium text-foreground">
                          {displayName}
                        </span>
                        {isGroupAdmin(message.user_id) && (
                          <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                        )}
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatMessageTime(message.created_at)}
                        </span>
                      </div>
                      <div
                        className={`inline-block px-3 sm:px-4 py-2 rounded-lg max-w-full break-words text-sm ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-muted text-foreground rounded-bl-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Message Input */}
      <Card className="rounded-none border-x-0 border-b-0">
        <CardContent className="p-3 sm:p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1 text-sm sm:text-base"
              maxLength={1000}
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || sending}
              size="sm"
              className="px-3 sm:px-4"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
            <span>{newMessage.length}/1000</span>
            <span className="hidden sm:inline">Press Enter to send</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}