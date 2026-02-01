import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStories } from '@/hooks/useStories';
import { useCurrentUserStory } from '@/hooks/useCurrentUserStory';
import { useProfile } from '@/hooks/useProfile';
import { useStoryPreloader } from '@/hooks/useStoryPreloader';
import { StoryViewer } from './stories/StoryViewer';
import { StoryAvatar } from './stories/StoryAvatar';
import { AddStoryPage } from './stories/AddStoryPage';
import { Skeleton } from '@/components/ui/skeleton';

export const Stories = () => {
  const { data: userStories, isLoading, isError, refetch } = useStories();
  const { data: profile } = useProfile();
  const { hasActiveStory, refetch: refetchCurrentUserStory } = useCurrentUserStory();
  const { preloadUserStories } = useStoryPreloader(userStories || []);
  
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [addStoryOpen, setAddStoryOpen] = useState(false);

  // Encontrar índice do usuário atual nos stories (se tiver story ativo)
  const currentUserStoryIndex = userStories?.findIndex(
    us => us.user_id === profile?.id
  ) ?? -1;

  const handleOwnAvatarClick = () => {
    if (hasActiveStory && currentUserStoryIndex >= 0) {
      // Se tem story ativo, abrir visualização
      setSelectedUserIndex(currentUserStoryIndex);
      setSelectedStoryIndex(0);
      setViewerOpen(true);
    } else {
      // Se não tem, abrir tela de adicionar
      setAddStoryOpen(true);
    }
  };

  const handleStoryClick = (userIndex: number, storyIndex: number) => {
    // Pré-carregar antes de abrir
    preloadUserStories(userIndex);
    setSelectedUserIndex(userIndex);
    setSelectedStoryIndex(storyIndex);
    setViewerOpen(true);
  };

  const handleViewerClose = () => {
    setViewerOpen(false);
  };

  const handleStoryCreated = () => {
    refetch();
    refetchCurrentUserStory();
  };

  if (isLoading) {
    return (
      <div className="py-4">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <Skeleton className="w-[68px] h-[68px] rounded-full" />
              <Skeleton className="w-12 h-3 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return null;
  }

  // Filtrar stories de outros usuários (excluir o próprio usuário da lista principal)
  const otherUsersStories = userStories?.filter(us => us.user_id !== profile?.id) || [];

  return (
    <>
      <div className="py-4">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4">
          {/* Avatar do próprio usuário - sempre primeiro */}
          {profile && (
            <StoryAvatar
              avatarUrl={profile.avatar_url}
              name={profile.name}
              hasActiveStory={hasActiveStory}
              hasUnviewedStory={false}
              isOwnStory={true}
              onClick={handleOwnAvatarClick}
              delay={0}
            />
          )}

          {/* Stories dos outros usuários */}
          {otherUsersStories.map((userStory, index) => {
            // Recalcular índice considerando que removemos o próprio usuário
            const originalIndex = userStories?.findIndex(us => us.user_id === userStory.user_id) ?? index;
            
            return (
              <StoryAvatar
                key={userStory.user_id}
                avatarUrl={userStory.profile.avatar_url}
                name={userStory.profile.name}
                hasActiveStory={true}
                hasUnviewedStory={userStory.has_unviewed}
                isOwnStory={false}
                onClick={() => handleStoryClick(originalIndex, 0)}
                delay={index + 1}
              />
            );
          })}
        </div>
      </div>

      {/* Story Viewer */}
      {viewerOpen && userStories && userStories.length > 0 && (
        <StoryViewer
          userStories={userStories}
          initialUserIndex={selectedUserIndex}
          initialStoryIndex={selectedStoryIndex}
          onClose={handleViewerClose}
        />
      )}

      {/* Página de Adicionar Story */}
      <AddStoryPage
        isOpen={addStoryOpen}
        onClose={() => setAddStoryOpen(false)}
        onSuccess={handleStoryCreated}
      />
    </>
  );
};
