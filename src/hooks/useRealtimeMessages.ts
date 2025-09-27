import { useState, useEffect, useCallback } from 'react';
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
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [profileCache, setProfileCache] = useState<Map<string, any>>(new Map());

  const fetchMessages = useCallback(async () => {
    if (!groupId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles(full_name, avatar_url)')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      if (data) {
        setMessages(data);
        const newCache = new Map();
        data.forEach(msg => {
          if (msg.profiles && msg.user_id) {
            newCache.set(msg.user_id, msg.profiles);
          }
        });
        setProfileCache(newCache);
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

      const addMessageWithProfile = (profile: any) => {
        newMessage.profiles = profile;
        setMessages(prev => {
          if (prev.find(msg => msg.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
      };

      if (profileCache.has(newMessage.user_id)) {
        addMessageWithProfile(profileCache.get(newMessage.user_id));
      } else {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', newMessage.user_id)
            .single();

          if (error) throw error;

          if (profile) {
            setProfileCache(prev => new Map(prev).set(newMessage.user_id, profile));
            addMessageWithProfile(profile);
          } else {
            addMessageWithProfile(null);
          }
        } catch (error) {
          console.error('Error fetching profile for new message:', error);
          addMessageWithProfile(null);
        }
      }
    } else if (payload.eventType === 'UPDATE' && payload.new) {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === (payload.new as Message).id ? { ...msg, ...(payload.new as Message) } : msg
        )
      );
    } else if (payload.eventType === 'DELETE' && payload.old) {
      setMessages(prev => 
        prev.filter(msg => msg.id !== (payload.old as Message).id)
      );
    }
  }, [profileCache]);

  useEffect(() => {
    if (!groupId) {
      if (channel) {
        supabase.removeChannel(channel);
        setChannel(null);
      }
      setMessages([]);
      setLoading(false);
      return;
    }

    fetchMessages();

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

    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [groupId, fetchMessages, handleRealtimeMessage]);

  return {
    messages,
    loading,
    sendMessage,
  };
};