import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BottomNav } from '@/components/BottomNav';
import { Feed } from '@/components/Feed';
import { LiveMap } from '@/components/LiveMap';
import { Groups } from '@/components/Groups';
import { Profile } from '@/components/Profile';
import { CreatePost } from '@/components/CreatePost';
import { RideTracker } from '@/components/RideTracker';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { NearbyRidersButton } from '@/components/NearbyRidersButton';
import { MessagesPage } from '@/components/messages/MessagesPage';

const Index = () => {
  const [activeTab, setActiveTab] = useState('feed');
  const [showCreate, setShowCreate] = useState(false);
  const [createPostType, setCreatePostType] = useState<'photo' | 'route' | 'live' | 'group'>('photo');
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [isStoryOverlayOpen, setIsStoryOverlayOpen] = useState(false);
  const [isRiderDetailOpen, setIsRiderDetailOpen] = useState(false);
  const [selectedRider, setSelectedRider] = useState<any>(null);
  const [showMessages, setShowMessages] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Resetar visualização de perfil ao mudar de tab
    if (tab !== 'profile') {
      setViewingUserId(null);
    }
  };

  const handleProfileClick = (userId: string) => {
    setViewingUserId(userId);
    setActiveTab('profile');
  };

  const handleFabOptionSelect = (option: 'photo' | 'route' | 'live' | 'group') => {
    console.log('Index: FAB option selected:', option);
    setCreatePostType(option);
    setShowCreate(true);
    console.log('Index: showCreate set to true');
  };

  const handleStoryOverlayChange = (isOpen: boolean) => {
    setIsStoryOverlayOpen(isOpen);
  };

  const handleMessagesClick = () => {
    setShowMessages(true);
  };

  const handleMessagesBack = () => {
    setShowMessages(false);
  };

  const handleOpenMessages = (conversationId?: string) => {
    setSelectedConversationId(conversationId || null);
    setShowMessages(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return (
          <Feed 
            onProfileClick={handleProfileClick} 
            onMessagesClick={handleMessagesClick}
            onStoryOverlayChange={handleStoryOverlayChange}
          />
        );
      case 'map':
        return <LiveMap onRiderSelectChange={setIsRiderDetailOpen} selectedRider={selectedRider} onRiderSelect={(rider) => { setSelectedRider(rider); setIsRiderDetailOpen(!!rider); }} />;
      case 'ride':
        return <RideTracker />;
      case 'groups':
        return <Groups />;
      case 'profile':
        return <Profile userId={viewingUserId} onMessageClick={handleOpenMessages} />;
      default:
        return (
          <Feed 
            onProfileClick={handleProfileClick} 
            onMessagesClick={handleMessagesClick}
            onStoryOverlayChange={handleStoryOverlayChange}
          />
        );
    }
  };

  // Ocultar BottomNav e FAB quando story overlay, create, rider detail ou mensagens está aberto
  const hideNavigation = isStoryOverlayOpen || showCreate || isRiderDetailOpen || showMessages;
  // Ocultar FAB na página do mapa
  const hideFAB = hideNavigation || activeTab === 'map';

  return (
    <div className="min-h-screen bg-background">
      {showMessages ? (
        <MessagesPage 
          onBack={() => {
            setShowMessages(false);
            setSelectedConversationId(null);
          }} 
          initialConversationId={selectedConversationId}
        />
      ) : (
        renderContent()
      )}
      {!hideNavigation && (
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      )}
      {!hideFAB && (
        <FloatingActionButton onOptionSelect={handleFabOptionSelect} />
      )}
      
      {/* Ícone de Pilotos Próximos - Visível em todas as páginas */}
      {!hideNavigation && (
        <NearbyRidersButton 
          onRiderSelect={(rider) => {
            setSelectedRider(rider);
            setIsRiderDetailOpen(true);
          }}
        />
      )}
      
      <AnimatePresence>
        {showCreate && (
          <CreatePost 
            onClose={() => setShowCreate(false)} 
            initialType={createPostType}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
