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

const Index = () => {
  const [activeTab, setActiveTab] = useState('feed');
  const [showCreate, setShowCreate] = useState(false);
  const [createPostType, setCreatePostType] = useState<'photo' | 'route' | 'live' | 'group'>('photo');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleFabOptionSelect = (option: 'photo' | 'route' | 'live' | 'group') => {
    console.log('Index: FAB option selected:', option);
    setCreatePostType(option);
    setShowCreate(true);
    console.log('Index: showCreate set to true');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return <Feed />;
      case 'map':
        return <LiveMap />;
      case 'ride':
        return <RideTracker />;
      case 'groups':
        return <Groups />;
      case 'profile':
        return <Profile />;
      default:
        return <Feed />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderContent()}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      <FloatingActionButton onOptionSelect={handleFabOptionSelect} />
      
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
