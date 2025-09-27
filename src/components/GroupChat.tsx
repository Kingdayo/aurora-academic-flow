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
import { Send, ArrowLeft, Users, Crown, Edit, Check, X } from 'lucide-react';
import { generateAvatarUrl } from '@/lib/utils';

interface GroupChatProps {
  groupId: string;
  onBack: () => void;
}

export default function GroupChat({ groupId, onBack }: GroupChatProps) {
  const { user } = useEnhancedAuth();
  const { messages, loading, sendMessage: sendMessageHook } = useRealtimeMessages(groupId);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadGroupInfo = async () => {
      try {
        const { data: group, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', groupId)
          .single();

        if (groupError) throw groupError;
        setGroupInfo(group);
      } catch (error) {
        console.error('Error loading group info:', error);
        toast.error('Failed to load group information');
      }
    };

    loadGroupInfo();
  }, [groupId]);

  useEffect(() => {
    const fetchMemberCount = async () => {
      const { count, error } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching member count:', error);
      } else {
        setMemberCount(count || 0);
      }
    };

    fetchMemberCount();

    const channel = supabase
      .channel(`group_members_count_${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`,
        },
        () => fetchMemberCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);


  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await sendMessageHook(newMessage.trim());
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleUpdateGroupName = async () => {
    if (!newGroupName.trim() || newGroupName === groupInfo.name) {
      setIsEditingName(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('groups')
        .update({ name: newGroupName.trim() })
        .eq('id', groupId)
        .select()
        .single();

      if (error) throw error;

      setGroupInfo(data);
      toast.success('Group name updated successfully');
    } catch (error) {
      console.error('Error updating group name:', error);
      toast.error('Failed to update group name');
      setNewGroupName(groupInfo.name); // Revert on failure
    } finally {
      setIsEditingName(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const isGroupAdmin = (group: any) => {
    return group?.owner_id === user?.id;
  };

  if (!groupInfo) {
    return (
      <div className="flex justify-center items-center h-64 bg-background">
        <div className="text-muted-foreground">Loading group...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <Card className="rounded-b-none border-b">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="p-2 h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage src={generateAvatarUrl(groupId)} />
              <AvatarFallback>{groupInfo?.name?.charAt(0) || 'G'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {isEditingName && isGroupAdmin(groupInfo) ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateGroupName();
                        if (e.key === 'Escape') setIsEditingName(false);
                      }}
                      className="h-8 text-base md:text-lg"
                      autoFocus
                    />
                    <Button variant="ghost" size="sm" onClick={handleUpdateGroupName} className="p-1 h-7 w-7">
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingName(false)} className="p-1 h-7 w-7">
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <CardTitle className="text-base md:text-lg truncate">
                      {groupInfo?.name || 'Group Chat'}
                    </CardTitle>
                    {isGroupAdmin(groupInfo) && (
                      <>
                        <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsEditingName(true);
                            setNewGroupName(groupInfo.name);
                          }}
                          className="p-1 h-7 w-7"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{memberCount} members</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {loading ? (
                 <div className="text-center text-muted-foreground py-8">
                 Loading messages...
               </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              <>
                {messages.map((message, index) => {
                  const showDate = index === 0 || 
                    formatDate(message.created_at) !== formatDate(messages[index - 1].created_at);
                  const isOwnMessage = message.user_id === user?.id;

                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <Badge variant="secondary" className="text-xs">
                            {formatDate(message.created_at)}
                          </Badge>
                        </div>
                      )}
                      <div className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage
                            src={message.profiles?.avatar_url || generateAvatarUrl(message.user_id)}
                            alt={message.profiles?.full_name || 'User'}
                          />
                          <AvatarFallback className="text-xs">
                            {message.profiles?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'text-right' : ''}`}>
                          <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                            <span className="text-sm font-medium">
                              {isOwnMessage ? 'You' : (message.profiles?.full_name || 'Unknown User')}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(message.created_at)}
                            </span>
                          </div>
                          <div
                            className={`rounded-lg px-3 py-2 text-sm break-words ${
                              isOwnMessage
                                ? 'bg-primary text-primary-foreground ml-auto'
                                : 'bg-muted'
                            }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      <Card className="rounded-t-none border-t">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending}
              className="flex-1"
              maxLength={1000}
            />
            <Button
              onClick={handleSendMessage}
              disabled={sending || !newMessage.trim()}
              size="sm"
              className="px-3"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
            <span>{newMessage.length}/1000</span>
            <span className="hidden sm:inline">Press Enter to send</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}