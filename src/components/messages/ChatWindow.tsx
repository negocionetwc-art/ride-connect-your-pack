import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMessages, useMessagesRealtime, useSendMessage, useMarkMessagesAsRead, useAddReaction } from '@/hooks/useMessages';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { Conversation } from '@/hooks/useConversations';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { supabase } from '@/integrations/supabase/client';

interface ChatWindowProps {
  conversation: Conversation | null;
  onBack: () => void;
}

export const ChatWindow = ({ conversation, onBack }: ChatWindowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const { data: messages, isLoading } = useMessages(conversation?.id || null);
  const { mutate: sendMessage } = useSendMessage();
  const { mutate: markAsRead } = useMarkMessagesAsRead();
  const { mutate: addReaction } = useAddReaction();
  const { isOtherTyping, setTyping } = useTypingIndicator(conversation?.id || null);

  // Obter ID do usuário atual
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Ativar realtime
  useMessagesRealtime(conversation?.id || null);

  // Marcar como lidas ao abrir conversa
  useEffect(() => {
    if (conversation?.id && conversation.unreadCount && conversation.unreadCount > 0) {
      markAsRead(conversation.id);
    }
  }, [conversation?.id, conversation?.unreadCount, markAsRead]);

  // Scroll para baixo ao receber novas mensagens
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (content: string, type: 'text' | 'image' | 'voice' = 'text', mediaUrl?: string) => {
    if (!conversation?.id) return;

    sendMessage({
      conversationId: conversation.id,
      content: type === 'text' ? content : undefined,
      type,
      mediaUrl
    });
  };

  const handleReact = (messageId: string, reaction: string | null) => {
    addReaction({ messageId, reaction });
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-accent/20">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Selecione uma conversa</p>
          <p className="text-sm mt-1">Escolha uma conversa para começar a enviar mensagens</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <ChatHeader 
        participant={conversation.otherParticipant}
        onBack={onBack}
        isTyping={isOtherTyping}
      />

      {/* Mensagens */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages && messages.length > 0 ? (
          <div className="space-y-3">
            {messages.map((message, index) => {
              const isOwn = message.sender_id === currentUserId;
              const prevMessage = messages[index - 1];
              const showAvatar = !prevMessage || 
                prevMessage.sender_id !== message.sender_id ||
                new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 60000;

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  onReact={handleReact}
                />
              );
            })}
            
            {/* Indicador de digitando */}
            {isOtherTyping && <TypingIndicator />}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <div>
              <p className="font-medium">Nenhuma mensagem ainda</p>
              <p className="text-sm mt-1">Envie uma mensagem para iniciar a conversa!</p>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <MessageInput
        conversationId={conversation.id}
        onSendMessage={handleSendMessage}
        onTyping={setTyping}
      />
    </div>
  );
};
