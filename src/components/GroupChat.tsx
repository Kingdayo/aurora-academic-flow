import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Send, Users, Crown, ArrowLeft, MoreVertical } from 'lucide-react';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { useGroups } from '@/hooks/useGroups';
import { formatDistanceToNow } from 'date-fns';

interface GroupChatProps {
  groupId: string;
  onBack: () => void;
}

const generateAvatar = (userId: string, isAdmin: boolean = false) => {
  const seed = userId || 'default';
  const baseUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  
  if (isAdmin) {
    // Admin avatars have crown accessories and special styling
    return `${baseUrl}&accessories=prescription02&clothingColor=262e33&eyebrowType=raisedexcited&eyeType=happy&facialHairColor=auburn&facialHairType=beardmedium&hairColor=auburn&hatColor=blue03&mouthType=smile&skinColor=light&topType=shortHairShortCurly`;
  } else {
    // Regular user avatars with varied but consistent styling
    return `${baseUrl}&clothingColor=3c4f5c&eyeType=default&mouthType=default&skinColor=tanned`;
  }
};

export default function GroupChat({ groupId, onBack }: GroupChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const [groupOwner, setGroupOwner] = useState<string | null>(null);
  const { messages, loading, sendMessage } = useRealtimeMessages(groupId);
  const { user } = useEnhancedAuth();
  const { groups } = useGroups();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setGroupOwner(group.owner_id);
    }
  }, [groupId, groups]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await sendMessage(newMessage.trim());
    setNewMessage('');
  };

  const getMessageDisplayName = (message: any) => {
    if (message.user_id === user?.id) {
      return 'You';
    }
    return message.profiles?.full_name || 'Unknown User';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getAvatarColor = (userId: string, isOwner: boolean) => {
    if (isOwner) {
      return 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-2 border-yellow-300 shadow-lg';
    }
    
    // Generate distinct colors based on user ID
    const colors = [
      'bg-blue-500 text-white',
      'bg-green-500 text-white',
      'bg-purple-500 text-white',
      'bg-pink-500 text-white',
      'bg-indigo-500 text-white',
      'bg-red-500 text-white',
      'bg-teal-500 text-white',
      'bg-orange-500 text-white',
    ];
    
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const isMessageFromOwner = (userId: string) => {
    return userId === groupOwner;
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Loading messages...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={generateAvatar(groupId)} />
              <AvatarFallback>{currentGroup?.name?.charAt(0) || 'G'}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{currentGroup?.name}</h2>
              <p className="text-sm text-gray-600">
                {onlineMembers.length} member{onlineMembers.length !== 1 ? 's' : ''} online
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <VoiceCommandButton onCommand={handleVoiceCommand} />
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwn = message.user_id === user?.id;
          const isAdmin = message.user_id === currentGroup?.owner_id;
          
          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={generateAvatar(message.user_id, isAdmin)} />
                <AvatarFallback>
                  {message.profiles?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-xs`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium flex items-center gap-1">
                    {isOwn ? 'You' : (message.profiles?.full_name || 'Unknown User')}
                    {isAdmin && <Crown className="h-3 w-3 text-yellow-500" />}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(message.created_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <div
                  className={`rounded-lg px-3 py-2 ${
                    isOwn
                      ? isAdmin 
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' // Special admin styling
                        : 'bg-blue-500 text-white'
                      : isAdmin
                        ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300' // Special admin styling
                        : 'bg-gray-100'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="p-4 border-t bg-gray-50">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            maxLength={1000}
          />
          <Button type="submit" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}