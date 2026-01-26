import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BottomNav } from '@/components/BottomNav';
import { Feed } from '@/components/Feed';
import { LiveMap } from '@/components/LiveMap';
import { Groups } from '@/components/Groups';
import { Profile } from '@/components/Profile';
import { CreatePost } from '@/components/CreatePost';

const Index = () => {
  const [activeTab, setActiveTab] = useState('feed');
  const [showCreate, setShowCreate] = useState(false);

  const handleTabChange = (tab: string) => {
    if (tab === 'create') {
      setShowCreate(true);
    } else {
      setActiveTab(tab);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return <Feed />;
      case 'map':
        return <LiveMap />;
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
      
      <AnimatePresence>
        {showCreate && <CreatePost onClose={() => setShowCreate(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default Index;
