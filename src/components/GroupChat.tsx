import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Send, ArrowLeft, Users, Crown } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  user_id: string;
  group_id: string;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface GroupChatProps {
  groupId: string;
  onBack: () => void;
}

export default function GroupChat({ groupId, onBack }: GroupChatProps) {
  const { user } = useEnhancedAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [memberCount, setMemberCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load group info and member count
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

        // Load member count
        const { data: members, error: membersError } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', groupId)
          .eq('status', 'active');

        if (!membersError && members) {
          setMemberCount(members.length);
        }
      } catch (error) {
        console.error('Error loading group info:', error);
        toast.error('Failed to load group information');
      }
    };

    loadGroupInfo();
  }, [groupId]);

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            profiles (
              full_name,
              avatar_url
            )
          `)
          .eq('group_id', groupId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error('Error loading messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [groupId]);

  // Real-time message subscription
  useEffect(() => {
    const channel = supabase
      .channel(`group_chat_${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          // Get user profile for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', newMessage.user_id)
            .single();

          const messageWithProfile = {
            ...newMessage,
            profiles: profile
          };

          setMessages(prev => [...prev, messageWithProfile]);

          // Show notification if message is from another user
          if (newMessage.user_id !== user?.id) {
            // Request notification permission if not granted
            if (Notification.permission === 'default') {
              await Notification.requestPermission();
            }

            // Show notification if permission is granted
            if (Notification.permission === 'granted') {
              const senderName = profile?.full_name || 'Someone';
              new Notification(`New message from ${senderName}`, {
                body: newMessage.content,
                icon: profile?.avatar_url || '/favicon.ico',
                tag: `group_${groupId}`,
              });
            }

            // Also show toast notification
            toast.success(`New message from ${profile?.full_name || 'Someone'}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, user?.id]);

  // Real-time member count updates
  useEffect(() => {
    const channel = supabase
      .channel(`group_members_${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`,
        },
        async () => {
          // Reload member count when members change
          const { data: members, error } = await supabase
            .from('group_members')
            .select('id')
            .eq('group_id', groupId)
            .eq('status', 'active');

          if (!error && members) {
            setMemberCount(members.length);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage.trim(),
          group_id: groupId,
          user_id: user?.id,
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-background">
        <div className="text-muted-foreground">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <Card className="rounded-b-none border-b">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2 h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`} />
              <AvatarFallback>{groupInfo?.name?.charAt(0) || 'G'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base md:text-lg truncate">
                  {groupInfo?.name || 'Group Chat'}
                </CardTitle>
                {isGroupAdmin(groupInfo) && (
                  <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
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

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
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
                            src={message.profiles?.avatar_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`}
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

      {/* Message Input */}
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
            />
            <Button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              size="sm"
              className="px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}