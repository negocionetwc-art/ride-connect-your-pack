import { ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ConversationProfile } from '@/hooks/useConversations';

interface ChatHeaderProps {
  participant: ConversationProfile | undefined;
  onBack: () => void;
  isTyping?: boolean;
}

export const ChatHeader = ({ participant, onBack, isTyping }: ChatHeaderProps) => {
  return (
    <div className="flex items-center gap-3 p-4 border-b border-border/30 bg-background">
      {/* Botão voltar (mobile) */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onBack}
        className="md:hidden shrink-0"
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>

      {/* Avatar e info */}
      <Avatar className="w-10 h-10 ring-2 ring-primary/20">
        <AvatarImage 
          src={participant?.avatar_url || '/placeholder.svg'} 
          alt={participant?.name || 'Usuário'} 
        />
        <AvatarFallback>
          {participant?.name?.charAt(0).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm truncate">
          {participant?.name || 'Usuário'}
        </h3>
        <p className="text-xs text-muted-foreground truncate">
          {isTyping ? (
            <span className="text-primary">digitando...</span>
          ) : (
            `@${participant?.username || 'usuario'} • Nível ${participant?.level || 1}`
          )}
        </p>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="shrink-0" disabled>
          <Phone className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="shrink-0" disabled>
          <Video className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="shrink-0">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
