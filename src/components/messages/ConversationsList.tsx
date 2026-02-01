import { useState } from 'react';
import { Search, Loader2, MessageSquarePlus, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useConversations, Conversation } from '@/hooks/useConversations';
import { ConversationItem } from './ConversationItem';

interface ConversationsListProps {
  activeConversationId: string | null;
  onSelectConversation: (conversation: Conversation) => void;
  onNewConversation: () => void;
}

export const ConversationsList = ({ 
  activeConversationId, 
  onSelectConversation,
  onNewConversation 
}: ConversationsListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: conversations, isLoading } = useConversations();

  const filteredConversations = conversations?.filter(conv => {
    if (!searchQuery.trim()) return true;
    const other = conv.otherParticipant;
    const query = searchQuery.toLowerCase();
    return (
      other?.name?.toLowerCase().includes(query) ||
      other?.username?.toLowerCase().includes(query)
    );
  }) || [];

  return (
    <div className="flex flex-col h-full border-r border-border/50">
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Mensagens</h2>
          <Button 
            size="icon" 
            variant="ghost"
            onClick={onNewConversation}
            className="shrink-0"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Lista de conversas */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredConversations.length > 0 ? (
          <div>
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                onClick={() => onSelectConversation(conversation)}
              />
            ))}
          </div>
        ) : searchQuery ? (
          <div className="text-center py-12 text-muted-foreground px-4">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Nenhuma conversa encontrada</p>
            <p className="text-sm mt-1">
              Tente buscar por outro nome
            </p>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground px-4">
            <MessageSquarePlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Nenhuma conversa ainda</p>
            <p className="text-sm mt-1">
              Comece uma nova conversa clicando no botão acima
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
