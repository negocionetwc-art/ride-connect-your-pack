import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Conversation } from '@/hooks/useConversations';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export const ConversationItem = ({ conversation, isActive, onClick }: ConversationItemProps) => {
  const other = conversation.otherParticipant;
  const hasUnread = (conversation.unreadCount || 0) > 0;

  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-border/30",
        isActive ? "bg-primary/10" : "hover:bg-accent/50",
        hasUnread && "bg-primary/5"
      )}
    >
      {/* Avatar */}
      <div className="relative">
        <Avatar className="w-14 h-14 ring-2 ring-primary/20">
          <AvatarImage 
            src={other?.avatar_url || '/placeholder.svg'} 
            alt={other?.name || 'Usuário'} 
          />
          <AvatarFallback>
            {other?.name?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        {/* Online indicator (placeholder - pode ser implementado com presença) */}
        {/* <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" /> */}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={cn(
            "font-semibold text-sm truncate",
            hasUnread && "text-foreground"
          )}>
            {other?.name || 'Usuário'}
          </span>
          
          {conversation.last_message_at && (
            <span className="text-xs text-muted-foreground shrink-0 ml-2">
              {formatDistanceToNow(new Date(conversation.last_message_at), { 
                addSuffix: false, 
                locale: ptBR 
              })}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-0.5">
          <p className={cn(
            "text-sm truncate",
            hasUnread ? "text-foreground font-medium" : "text-muted-foreground"
          )}>
            {conversation.last_message_text || 'Inicie uma conversa'}
          </p>
          
          {/* Badge de não lidas */}
          {hasUnread && (
            <span className="ml-2 px-1.5 py-0.5 min-w-[20px] text-center text-xs bg-primary text-primary-foreground rounded-full shrink-0">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
