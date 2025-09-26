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
    id: string;
    full_name: string | null;
    avatar_url?: string | null;
  };
}

interface MessagePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Message | {};
  old: Message | {};
}

export const useRealtimeMessages = (groupId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

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
        .select(`
          *,
          profiles(full_name, avatar_url)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
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

  const handleRealtimeMessage = useCallback((payload: any) => {
    console.log('Realtime message received:', payload);

    if (payload.eventType === 'INSERT' && payload.new) {
      // Fetch the complete message with profile data
      const fetchCompleteMessage = async () => {
        try {
          const { data, error } = await supabase
            .from('messages')
            .select(`
              *,
              profiles(id, full_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (error) throw error;

          setMessages(prev => {
            // Prevent duplicate messages
            if (prev.find(msg => msg.id === data.id)) {
              return prev;
            }
            return [...prev, data];
          });
        } catch (error) {
          console.error('Error fetching complete message:', error);
        }
      };

      fetchCompleteMessage();
    } else if (payload.eventType === 'UPDATE' && payload.new) {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
        )
      );
    } else if (payload.eventType === 'DELETE' && payload.old) {
      setMessages(prev => 
        prev.filter(msg => msg.id !== payload.old.id)
      );
    }
  }, []);

  useEffect(() => {
    if (!groupId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    // Fetch initial messages
    fetchMessages();

    // Set up realtime subscription
    const messageChannel = supabase
      .channel(`messages:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          handleRealtimeMessage(payload);
        }
      )
      .subscribe((status) => {
        console.log('Messages subscription status:', status);
      });

    setChannel(messageChannel);

    return () => {
      if (messageChannel) {
        supabase.removeChannel(messageChannel);
      }
    };
  }, [groupId, fetchMessages, handleRealtimeMessage]);

  // Cleanup channel on unmount
  useEffect(() => {
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [channel]);

  return {
    messages,
    loading,
    sendMessage,
    fetchMessages,
  };
};
