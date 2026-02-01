import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, CheckCheck, Image as ImageIcon, Mic, Share2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Message } from '@/hooks/useMessages';
import { MessageReactions } from './MessageReactions';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  onReact?: (messageId: string, reaction: string | null) => void;
}

export const MessageBubble = ({ 
  message, 
  isOwn, 
  showAvatar = true,
  onReact 
}: MessageBubbleProps) => {
  const [showReactions, setShowReactions] = useState(false);

  const renderContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="relative">
            <img 
              src={message.media_url || ''} 
              alt="Imagem" 
              className="max-w-[240px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.media_url || '', '_blank')}
            />
          </div>
        );
      
      case 'voice':
        return (
          <div className="flex items-center gap-2 min-w-[150px]">
            <Mic className="w-4 h-4 text-primary" />
            <audio 
              src={message.media_url || ''} 
              controls 
              className="max-w-[200px] h-8"
            />
          </div>
        );
      
      case 'post_share':
        return (
          <div className="flex items-center gap-2 p-2 bg-accent/50 rounded-lg">
            <Share2 className="w-4 h-4" />
            <span className="text-sm">Post compartilhado</span>
            {message.post?.image_url && (
              <img 
                src={message.post.image_url} 
                alt="Post" 
                className="w-12 h-12 object-cover rounded"
              />
            )}
          </div>
        );
      
      default:
        return (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        );
    }
  };

  return (
    <div 
      className={cn(
        "flex gap-2 max-w-[80%] group",
        isOwn ? "ml-auto flex-row-reverse" : ""
      )}
      onMouseEnter={() => setShowReactions(true)}
      onMouseLeave={() => setShowReactions(false)}
    >
      {/* Avatar (apenas para mensagens recebidas) */}
      {!isOwn && showAvatar && (
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarImage 
            src={message.sender?.avatar_url || '/placeholder.svg'} 
            alt={message.sender?.name || 'Usuário'} 
          />
          <AvatarFallback>
            {message.sender?.name?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
      
      {/* Espaço reservado quando não mostra avatar */}
      {!isOwn && !showAvatar && <div className="w-8 shrink-0" />}

      {/* Bolha da mensagem */}
      <div className="relative">
        <div 
          className={cn(
            "px-4 py-2 rounded-2xl",
            isOwn 
              ? "bg-primary text-primary-foreground rounded-tr-sm" 
              : "bg-accent rounded-tl-sm"
          )}
        >
          {renderContent()}
          
          {/* Timestamp e status */}
          <div className={cn(
            "flex items-center gap-1 mt-1",
            isOwn ? "justify-end" : ""
          )}>
            <span className={cn(
              "text-[10px]",
              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              {formatDistanceToNow(new Date(message.created_at), { 
                addSuffix: false, 
                locale: ptBR 
              })}
            </span>
            
            {/* Status de leitura (apenas para mensagens próprias) */}
            {isOwn && (
              message.is_read ? (
                <CheckCheck className="w-3.5 h-3.5 text-primary-foreground/70" />
              ) : (
                <Check className="w-3.5 h-3.5 text-primary-foreground/70" />
              )
            )}
          </div>
        </div>

        {/* Reação na mensagem */}
        {message.reaction && (
          <div className={cn(
            "absolute -bottom-2 bg-background rounded-full px-1 shadow-sm border text-sm",
            isOwn ? "left-0" : "right-0"
          )}>
            {message.reaction === 'heart' && '❤️'}
            {message.reaction === 'laugh' && '😂'}
            {message.reaction === 'thumbs_up' && '👍'}
            {message.reaction === 'fire' && '🔥'}
            {message.reaction === 'sad' && '😢'}
          </div>
        )}

        {/* Menu de reações (aparece no hover) */}
        {showReactions && onReact && !isOwn && (
          <MessageReactions 
            messageId={message.id}
            currentReaction={message.reaction}
            onReact={onReact}
            className={cn(
              "absolute -top-8",
              isOwn ? "right-0" : "left-0"
            )}
          />
        )}
      </div>
    </div>
  );
};
