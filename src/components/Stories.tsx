import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStories } from '@/hooks/useStories';
import { StoryViewer } from './stories/StoryViewer';
import { AddStoryButton } from './stories/AddStoryButton';
import { Skeleton } from '@/components/ui/skeleton';

export const Stories = () => {
  const { data: userStories, isLoading } = useStories();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  const handleStoryClick = (userIndex: number, storyIndex: number) => {
    setSelectedUserIndex(userIndex);
    setSelectedStoryIndex(storyIndex);
    setViewerOpen(true);
  };

  const handleViewerClose = () => {
    setViewerOpen(false);
  };

  if (isLoading) {
    return (
      <div className="py-4">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
              <Skeleton className="w-16 h-16 rounded-full" />
              <Skeleton className="w-12 h-3 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!userStories || userStories.length === 0) {
    return (
      <div className="py-4">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4">
          <AddStoryButton />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="py-4">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4">
          {/* Botão Adicionar Story */}
          <AddStoryButton />

          {/* Stories dos usuários */}
          {userStories.map((userStory, userIndex) => {
            const firstStory = userStory.stories[0];
            const hasUnviewed = userStory.has_unviewed;

            return (
              <motion.button
                key={userStory.user_id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (userIndex + 1) * 0.05 }}
                onClick={() => handleStoryClick(userIndex, 0)}
                className="flex flex-col items-center gap-1 flex-shrink-0"
              >
                <div
                  className={`relative p-0.5 rounded-full ${
                    hasUnviewed
                      ? 'bg-gradient-to-br from-primary via-orange-500 to-yellow-500'
                      : 'bg-muted'
                  }`}
                >
                  <div className="p-0.5 bg-background rounded-full">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden">
                      <img
                        src={userStory.profile.avatar_url || '/placeholder.svg'}
                        alt={userStory.profile.name}
                        className="w-full h-full object-cover"
                      />
                      {firstStory && (
                        <div className="absolute inset-0 bg-black/20" />
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-foreground/80 max-w-[70px] truncate">
                  {userStory.profile.name.split(' ')[0]}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Story Viewer */}
      {viewerOpen && userStories.length > 0 && (
        <StoryViewer
          userStories={userStories}
          initialUserIndex={selectedUserIndex}
          initialStoryIndex={selectedStoryIndex}
          onClose={handleViewerClose}
        />
      )}
    </>
  );
};
