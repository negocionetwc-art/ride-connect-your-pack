import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { StoryProgress } from './StoryProgress';
import { StoryImageLoader, StoryVideoLoader } from './StoryImageLoader';
import { useStoryView } from '@/hooks/useStoryView';
import { useStoryPreloader } from '@/hooks/useStoryPreloader';
import type { UserStories } from '@/hooks/useStories';

interface StoryViewerProps {
  userStories: UserStories[];
  initialUserIndex: number;
  initialStoryIndex: number;
  onClose: () => void;
}

const IMAGE_DURATION = 5000; // 5 segundos para imagens
const MIN_SWIPE_DISTANCE = 50;

export function StoryViewer({
  userStories,
  initialUserIndex,
  initialStoryIndex,
  onClose,
}: StoryViewerProps) {
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [videoDuration, setVideoDuration] = useState(IMAGE_DURATION);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const { mutate: markAsViewed } = useStoryView();
  const { preloadUserStories } = useStoryPreloader(userStories);

  const currentUser = userStories[currentUserIndex];
  const currentStories = currentUser?.stories || [];
  const currentStory = currentStories[currentStoryIndex];

  // Pré-carregar stories quando mudar de usuário
  useEffect(() => {
    preloadUserStories(currentUserIndex);
  }, [currentUserIndex, preloadUserStories]);

  // Handlers de navegação
  const handleNext = useCallback(() => {
    setCurrentStoryIndex(prev => {
      const currentStories = userStories[currentUserIndex]?.stories || [];
      if (prev < currentStories.length - 1) {
        return prev + 1;
      } else if (currentUserIndex < userStories.length - 1) {
        setCurrentUserIndex(currentUserIndex + 1);
        return 0;
      } else {
        onClose();
        return prev;
      }
    });
    setProgress(0);
    setIsMediaLoaded(false);
  }, [currentUserIndex, userStories, onClose]);

  const handlePrevious = useCallback(() => {
    setCurrentStoryIndex(prev => {
      if (prev > 0) {
        return prev - 1;
      } else if (currentUserIndex > 0) {
        const prevUser = userStories[currentUserIndex - 1];
        setCurrentUserIndex(currentUserIndex - 1);
        return prevUser.stories.length - 1;
      }
      return prev;
    });
    setProgress(0);
    setIsMediaLoaded(false);
  }, [currentUserIndex, userStories]);

  // Callback quando mídia carrega
  const handleMediaLoaded = useCallback(() => {
    setIsMediaLoaded(true);
    if (currentStory?.media_type === 'video' && videoRef.current) {
      const video = videoRef.current;
      if (video.duration && !isNaN(video.duration)) {
        setVideoDuration(video.duration * 1000);
      }
    } else {
      setVideoDuration(IMAGE_DURATION);
    }
  }, [currentStory]);

  // Marcar como visto quando story muda
  useEffect(() => {
    if (currentStory && !currentStory.is_viewed) {
      markAsViewed(currentStory.id);
    }
  }, [currentStory, markAsViewed]);

  // Gerenciar progresso automático
  useEffect(() => {
    if (!currentStory || isPaused || !isMediaLoaded) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    if (currentStory.media_type === 'video' && videoRef.current) {
      const video = videoRef.current;
      video.play().catch(console.error);
      return;
    }

    // Para imagens, usar intervalo
    setProgress(0);
    const startTime = Date.now();
    
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / videoDuration) * 100;
      
      if (newProgress >= 100) {
        setProgress(100);
        handleNext();
      } else {
        setProgress(newProgress);
      }
    }, 50);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentStory, isPaused, isMediaLoaded, videoDuration, handleNext]);

  // Handle de progresso de vídeo
  const handleVideoTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      if (video.duration && !isNaN(video.duration)) {
        const currentTime = video.currentTime;
        const duration = video.duration;
        setProgress((currentTime / duration) * 100);
      }
    }
  }, []);

  // Gestos touch
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    setIsPaused(true);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) {
      setIsPaused(false);
      return;
    }

    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;

    if (deltaY > MIN_SWIPE_DISTANCE && Math.abs(deltaX) < Math.abs(deltaY)) {
      onClose();
      return;
    }

    if (Math.abs(deltaX) > MIN_SWIPE_DISTANCE && Math.abs(deltaY) < Math.abs(deltaX)) {
      if (deltaX > 0) {
        handlePrevious();
      } else {
        handleNext();
      }
    }

    touchStartRef.current = null;
    setIsPaused(false);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  // Click handlers para desktop
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    
    if (clickX < width / 3) {
      handlePrevious();
    } else if (clickX > (width * 2) / 3) {
      handleNext();
    } else {
      setIsPaused(!isPaused);
      if (videoRef.current) {
        if (isPaused) {
          videoRef.current.play();
        } else {
          videoRef.current.pause();
        }
      }
    }
  };

  if (!currentStory || !currentUser) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Fundo com blur da imagem atual */}
        {isMediaLoaded && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${currentStory.media_url})`,
              filter: 'blur(30px)',
              transform: 'scale(1.2)',
            }}
          />
        )}

        {/* Overlay escuro */}
        <div className="absolute inset-0 bg-background/60" />

        {/* Conteúdo */}
        <div
          className="relative w-full h-full flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={handleClick}
        >
          {/* Barra de progresso */}
          {currentStories.length > 0 && (
            <StoryProgress
              stories={currentStories}
              currentIndex={currentStoryIndex}
              progress={progress}
              isPaused={isPaused || !isMediaLoaded}
            />
          )}

          {/* Header com informações do usuário */}
          <div className="absolute top-12 left-0 right-0 z-50 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary">
                <img
                  src={currentUser.profile.avatar_url || '/placeholder.svg'}
                  alt={currentUser.profile.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-foreground font-medium">{currentUser.profile.name}</p>
                <p className="text-muted-foreground text-xs">@{currentUser.profile.username}</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mídia */}
          <div className="relative w-full max-w-sm aspect-[9/16] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentUser.user_id}-${currentStory.id}`}
                className="absolute inset-0 rounded-2xl overflow-hidden bg-muted"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {currentStory.media_type === 'image' ? (
                  <StoryImageLoader
                    src={currentStory.media_url}
                    alt="Story"
                    onLoad={handleMediaLoaded}
                  />
                ) : (
                  <StoryVideoLoader
                    src={currentStory.media_url}
                    videoRef={videoRef}
                    onLoad={handleMediaLoaded}
                    onTimeUpdate={handleVideoTimeUpdate}
                    onEnded={handleNext}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Indicadores de navegação (desktop) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors opacity-0 hover:opacity-100"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors opacity-0 hover:opacity-100"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
