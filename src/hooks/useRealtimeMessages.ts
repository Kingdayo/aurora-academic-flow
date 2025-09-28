import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface Profile {
  id: string;
  full_name: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

interface Message {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  message_type: 'text' | 'system' | 'task_update';
  metadata: any;
  created_at: string;
  updated_at: string;
  profiles: Profile;
}

export const useRealtimeMessages = (groupId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!groupId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_messages_for_group', {
        p_group_id: groupId,
      });

      if (error) {
        // Handle RLS errors gracefully
        if (error.code === 'P0001' && error.message.includes('User is not a member')) {
          toast.error("You don't have access to this group.");
          setMessages([]);
        } else {
          throw error;
        }
      }

      if (data) {
        // The RPC returns a list of messages, each with a 'profiles' JSONB object.
        // We cast it to our Message type.
        setMessages(data as Message[]);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
      setMessages([]); // Clear messages on error
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
      try {
        // The get_message_with_profile function ensures we get profile data securely.
        const { data, error } = await supabase
          .rpc('get_message_with_profile', { p_message_id: payload.new.id })
          .single();

        if (error) {
          console.error('Error fetching new message with profile:', error.message);
          // If the RPC fails (e.g., due to RLS), we don't add the message.
          // This is safer than adding a message with missing data.
          return;
        }

        if (data) {
          const newMessage = data as Message;
          setMessages(prev => {
            // Avoid adding duplicate messages that might already be present
            if (prev.find(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      } catch (error) {
        console.error('Error processing real-time message:', error);
      }
    } else if (payload.eventType === 'UPDATE' && payload.new) {
      // For updates, we can't easily get the profile, so we update the message content.
      // This is a trade-off; profile info won't update in real-time, but messages will.
      setMessages(prev =>
        prev.map(msg =>
          msg.id === (payload.new as Message).id
            ? { ...msg, ...payload.new, profiles: msg.profiles } // Preserve existing profile
            : msg
        )
      );
    } else if (payload.eventType === 'DELETE' && payload.old) {
      setMessages(prev => 
        prev.filter(msg => msg.id !== (payload.old as { id: string }).id)
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