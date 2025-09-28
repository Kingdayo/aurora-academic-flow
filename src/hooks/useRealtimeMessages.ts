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
    email?: string | null;
    avatar_url?: string | null;
  };
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

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles!messages_user_id_fkey (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      if (data) {
        const messages = data as Message[];
        
        // For messages with missing profile data, try to fetch it properly
        const messagesWithProfiles = await Promise.all(
          messages.map(async (message) => {
            if (!message.profiles || (!message.profiles.full_name && !message.profiles.email)) {
              console.log('Missing profile data for message, fetching user info:', message.id);

              try {
                // Try direct profiles table access
                const { data: profileData, error: profileError } = await supabase
                  .from('profiles')
                  .select('id, full_name, email, avatar_url')
                  .eq('id', message.user_id)
                  .maybeSingle();

                if (!profileError && profileData) {
                  message.profiles = profileData;
                  console.log('Successfully fetched profile data for message:', message.id, profileData);
                } else {
                  console.log('Could not fetch profile data for message:', message.id, profileError);
                  // Create empty profile if no data is available
                  message.profiles = {
                    id: message.user_id,
                    full_name: '',
                    email: '',
                    avatar_url: ''
                  };
                }
              } catch (error) {
                console.log('Error fetching user data for message:', message.id, error);
                message.profiles = {
                  id: message.user_id,
                  full_name: '',
                  email: '',
                  avatar_url: ''
                };
              }
            }
            return message;
          })
        );
        
        setMessages(messagesWithProfiles);
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
      try {
        const { data, error } = await supabase
          .rpc('get_message_with_profile', { p_message_id: payload.new.id })
          .maybeSingle();

        if (error) {
          console.error('Error fetching new message with profile:', error);
          return;
        }

        if (data) {
          // The RPC returns a single row, which is our new message object
          const newMessage = data as Message;
          
          // If profile data is missing, try to fetch it properly
          if (!newMessage.profiles || (!newMessage.profiles.full_name && !newMessage.profiles.email)) {
            console.log('Profile data missing, fetching user info for user:', newMessage.user_id);

            try {
              // Try direct profiles table access
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name, email, avatar_url')
                .eq('id', newMessage.user_id)
                .maybeSingle();

              if (!profileError && profileData) {
                newMessage.profiles = profileData;
                console.log('Successfully fetched profile data:', profileData);
              } else {
                console.log('Could not fetch profile data, error:', profileError);
                // Create empty profile if no data is available
                newMessage.profiles = {
                  id: newMessage.user_id,
                  full_name: '',
                  email: '',
                  avatar_url: ''
                };
              }
            } catch (profileFetchError) {
              console.log('Error fetching user data:', profileFetchError);
              newMessage.profiles = {
                id: newMessage.user_id,
                full_name: '',
                email: '',
                avatar_url: ''
              };
            }
          }
          
          setMessages(prev => {
            if (prev.find(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      } catch (error) {
        console.error('Error in handleRealtimeMessage:', error);
      }
    } else if (payload.eventType === 'UPDATE' && payload.new) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === (payload.new as Message).id
            ? { ...msg, ...payload.new }
            : msg
        )
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