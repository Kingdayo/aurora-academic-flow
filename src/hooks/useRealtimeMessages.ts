import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface Message {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  message_type: 'text' | 'system' | 'task_update';
  metadata: any;
  created_at: string;
  updated_at: string;
  profiles?: {
    id?: string;
    full_name: string | null;
    avatar_url?: string | null;
  };
}

export const useRealtimeMessages = (groupId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const profileCache = useRef(new Map<string, any>());

  const fetchMessages = useCallback(async () => {
    if (!groupId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Pre-populate profile cache with all group members
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('user_id, profiles(id, full_name, avatar_url)')
        .eq('group_id', groupId);

      if (membersError) throw membersError;

      if (members) {
        members.forEach((member: any) => {
          if (member.profiles) {
            profileCache.current.set(member.user_id, member.profiles);
          }
        });
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      if (data) {
        const messagesWithProfiles = data.map(msg => ({
          ...msg,
          profiles: profileCache.current.get(msg.user_id)
        }));
        setMessages(messagesWithProfiles as Message[]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const sendMessage = async (content: string, messageType: 'text' | 'system' | 'task_update' = 'text', metadata = {}) => {
    if (!groupId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('messages')
        .insert([{
          group_id: groupId,
          user_id: user.id,
          content,
          message_type: messageType,
          metadata
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      throw error;
    }
  };

  const handleRealtimeMessage = useCallback(async (payload: any) => {
    if (payload.eventType === 'INSERT' && payload.new) {
      const newMessage = { ...payload.new } as Message;

      // Ensure profile data is attached to the new message
      if (!newMessage.profiles && profileCache.current.has(newMessage.user_id)) {
        newMessage.profiles = profileCache.current.get(newMessage.user_id);
      } else if (!newMessage.profiles) {
        // Fallback for safety
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', newMessage.user_id)
            .single();
          if (error) throw error;
          if (profile) {
            profileCache.current.set(newMessage.user_id, profile);
            newMessage.profiles = profile;
          }
        } catch (error) {
          console.error('Error fetching profile for new message:', error);
        }
      }

      setMessages(prev => {
        if (prev.find(msg => msg.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });
    } else if (payload.eventType === 'UPDATE' && payload.new) {
      setMessages(prev =>
        prev.map(msg => {
          if (msg.id === (payload.new as Message).id) {
            const updatedMessage = { ...msg, ...payload.new } as Message;
            // Re-apply profile from cache if available, to ensure consistency
            if (profileCache.current.has(updatedMessage.user_id)) {
              updatedMessage.profiles = profileCache.current.get(updatedMessage.user_id);
            }
            return updatedMessage;
          }
          return msg;
        })
      );
    } else if (payload.eventType === 'DELETE' && payload.old) {
      setMessages(prev => 
        prev.filter(msg => msg.id !== (payload.old as Message).id)
      );
    }
  }, []);

  useEffect(() => {
    if (!groupId) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setMessages([]);
      setLoading(false);
      return;
    }

    fetchMessages();

    if (channelRef.current && channelRef.current.topic === `messages:${groupId}`) {
        return;
    }

    if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
    }

    const newChannel = supabase
      .channel(`messages:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`
        },
        handleRealtimeMessage
      )
      .subscribe();

    channelRef.current = newChannel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [groupId, fetchMessages, handleRealtimeMessage]);

  return {
    messages,
    loading,
    sendMessage,
  };
};