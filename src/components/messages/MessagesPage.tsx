import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConversations, Conversation } from '@/hooks/useConversations';
import { ConversationsList } from './ConversationsList';
import { ChatWindow } from './ChatWindow';
import { NewConversationDialog } from './NewConversationDialog';

interface MessagesPageProps {
  onBack: () => void;
  initialConversationId?: string | null;
}

export const MessagesPage = ({ onBack, initialConversationId }: MessagesPageProps) => {
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [isMobileChat, setIsMobileChat] = useState(false);
  const { data: conversations } = useConversations();

  // Selecionar conversa inicial se fornecida
  useEffect(() => {
    if (initialConversationId && conversations) {
      const conv = conversations.find(c => c.id === initialConversationId);
      if (conv) {
        setActiveConversation(conv);
      }
    }
  }, [initialConversationId, conversations]);

  // Detectar se está em mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileChat(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSelectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
  };

  const handleBackToList = () => {
    setActiveConversation(null);
  };

  const handleConversationCreated = (conversationId: string) => {
    // Buscar a conversa criada e selecionar
    const newConv = conversations?.find(c => c.id === conversationId);
    if (newConv) {
      setActiveConversation(newConv);
    }
  };

  // Layout mobile: mostrar lista ou chat
  if (isMobileChat) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header mobile */}
        {!activeConversation && (
          <header className="sticky top-0 z-40 glass border-b border-border/30">
            <div className="flex items-center gap-3 px-4 h-14">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="font-display text-xl tracking-wider">Mensagens</h1>
            </div>
          </header>
        )}

        {activeConversation ? (
          <ChatWindow 
            conversation={activeConversation}
            onBack={handleBackToList}
          />
        ) : (
          <ConversationsList
            activeConversationId={null}
            onSelectConversation={handleSelectConversation}
            onNewConversation={() => setShowNewConversation(true)}
          />
        )}

        <NewConversationDialog
          isOpen={showNewConversation}
          onClose={() => setShowNewConversation(false)}
          onConversationCreated={handleConversationCreated}
        />
      </div>
    );
  }

  // Layout desktop: lado a lado
  return (
    <div className="min-h-screen bg-background">
      {/* Header desktop */}
      <header className="sticky top-0 z-40 glass border-b border-border/30">
        <div className="flex items-center gap-3 px-4 h-14">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display text-xl tracking-wider">Mensagens</h1>
        </div>
      </header>

      <div className="flex h-[calc(100vh-56px)]">
        {/* Lista de conversas */}
        <div className="w-80 shrink-0">
          <ConversationsList
            activeConversationId={activeConversation?.id || null}
            onSelectConversation={handleSelectConversation}
            onNewConversation={() => setShowNewConversation(true)}
          />
        </div>

        {/* Chat */}
        <ChatWindow 
          conversation={activeConversation}
          onBack={handleBackToList}
        />
      </div>

      <NewConversationDialog
        isOpen={showNewConversation}
        onClose={() => setShowNewConversation(false)}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
};
