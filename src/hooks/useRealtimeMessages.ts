import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

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
    full_name: string | null;
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
  const { toast } = useToast();

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
          profiles(full_name)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [groupId, toast]);

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
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleRealtimeMessage = useCallback((payload: any) => {
    console.log('Realtime message received:', payload);

    if (payload.eventType === 'INSERT' && payload.new) {
      setMessages(prev => {
        // Prevent duplicate messages
        if (prev.find(msg => msg.id === payload.new.id)) {
          return prev;
        }
        return [...prev, payload.new as Message];
      });
    } else if (payload.eventType === 'UPDATE' && payload.new) {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === payload.new.id ? payload.new as Message : msg
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