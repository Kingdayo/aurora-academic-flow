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
  const [memberCount, setMemberCount] = useState(0);
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

      setMemberCount(members?.length || 0);

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

  const getUserDisplayName = (message: any) => {
    if (message.user_id === user?.id) {
      return 'You';
    }
    return message.profiles?.full_name || 'Unknown User';
  };

  if (loading && !messages.length) {
    return (
      <div className="flex justify-center items-center h-96 bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <Card className="rounded-none border-x-0 border-t-0 flex-shrink-0">
        <CardHeader className="pb-2 md:pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                <AvatarImage src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`} />
                <AvatarFallback className="text-xs md:text-sm">{groupInfo?.name?.charAt(0) || 'G'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm md:text-lg truncate">{groupInfo?.name || 'Group Chat'}</CardTitle>
                <p className="text-xs md:text-sm text-gray-500 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {memberCount} member{memberCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-3 md:px-4 py-2">
          <div className="space-y-3 md:space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <div className="text-gray-400 mb-2">
                  <Users className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-2 md:mb-4" />
                </div>
                <p className="text-gray-500 text-sm md:text-base">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.user_id === user?.id;
                const displayName = getUserDisplayName(message);
                
                return (
                  <div
                    key={message.id}
                    className={`flex gap-2 md:gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <Avatar className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0">
                      <AvatarImage 
                        src={message.profiles?.avatar_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`} 
                        alt={displayName} 
                      />
                      <AvatarFallback className="text-xs">
                        {displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 max-w-[75%] md:max-w-[60%] ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                      <div className={`flex items-center gap-1 md:gap-2 mb-1 text-xs ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="font-medium text-gray-700 truncate">
                          {displayName}
                        </span>
                        {isGroupAdmin(message.user_id) && (
                          <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                        )}
                        <span className="text-gray-500 text-xs flex-shrink-0">
                          {formatMessageTime(message.created_at)}
                        </span>
                      </div>
                      <div
                        className={`inline-block px-3 py-2 rounded-lg max-w-full break-words text-sm ${
                          isOwnMessage
                            ? 'bg-purple-600 text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
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
      <Card className="rounded-none border-x-0 border-b-0 flex-shrink-0">
        <CardContent className="p-3 md:p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1 text-sm md:text-base"
              maxLength={1000}
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || sending}
              size="sm"
              className="px-3 h-9 md:h-10"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            <span>{newMessage.length}/1000</span>
            <span className="hidden sm:inline">Press Enter to send</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}