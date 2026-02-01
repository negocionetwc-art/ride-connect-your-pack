import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { StoryProgress } from './StoryProgress';
import { useStoryView } from '@/hooks/useStoryView';
import type { StoryWithProfile, UserStories } from '@/hooks/useStories';

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
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoDuration, setVideoDuration] = useState(IMAGE_DURATION);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const { mutate: markAsViewed } = useStoryView();

  const currentUser = userStories[currentUserIndex];
  const currentStories = currentUser?.stories || [];
  const currentStory = currentStories[currentStoryIndex];

  // Handlers de navegação (definidos antes dos useEffects que os usam)
  const handleNext = useCallback(() => {
    setCurrentStoryIndex(prev => {
      const currentStories = userStories[currentUserIndex]?.stories || [];
      if (prev < currentStories.length - 1) {
        // Próximo story do mesmo usuário
        return prev + 1;
      } else if (currentUserIndex < userStories.length - 1) {
        // Próximo usuário
        setCurrentUserIndex(currentUserIndex + 1);
        return 0;
      } else {
        // Fim dos stories, fechar
        onClose();
        return prev;
      }
    });
    setProgress(0);
    setIsVideoLoaded(false);
  }, [currentUserIndex, userStories, onClose]);

  const handlePrevious = useCallback(() => {
    setCurrentStoryIndex(prev => {
      if (prev > 0) {
        // Story anterior do mesmo usuário
        return prev - 1;
      } else if (currentUserIndex > 0) {
        // Usuário anterior
        const prevUser = userStories[currentUserIndex - 1];
        setCurrentUserIndex(currentUserIndex - 1);
        return prevUser.stories.length - 1;
      }
      return prev;
    });
    setProgress(0);
    setIsVideoLoaded(false);
  }, [currentUserIndex, userStories]);

  // Calcular duração baseada no tipo de mídia
  useEffect(() => {
    if (currentStory) {
      if (currentStory.media_type === 'video') {
        if (videoRef.current) {
          const video = videoRef.current;
          if (video.duration && !isNaN(video.duration)) {
            setVideoDuration(video.duration * 1000);
            setIsVideoLoaded(true);
          } else {
            video.addEventListener('loadedmetadata', () => {
              if (video.duration && !isNaN(video.duration)) {
                setVideoDuration(video.duration * 1000);
                setIsVideoLoaded(true);
              }
            });
          }
        }
      } else {
        setVideoDuration(IMAGE_DURATION);
        setIsVideoLoaded(true);
      }
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
    if (!currentStory || isPaused || !isVideoLoaded) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    // Se for vídeo, controlar pelo evento do vídeo
    if (currentStory.media_type === 'video' && videoRef.current) {
      const video = videoRef.current;
      video.play().catch(console.error);

      const updateProgress = () => {
        if (video.duration && !isNaN(video.duration)) {
          const currentTime = video.currentTime;
          const duration = video.duration;
          setProgress((currentTime / duration) * 100);
        }
      };

      const handleVideoEnd = () => {
        handleNext();
      };

      video.addEventListener('timeupdate', updateProgress);
      video.addEventListener('ended', handleVideoEnd);

      return () => {
        video.removeEventListener('timeupdate', updateProgress);
        video.removeEventListener('ended', handleVideoEnd);
        video.pause();
      };
    } else {
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
    }
  }, [currentStory, isPaused, isVideoLoaded, videoDuration, handleNext]);

  // Gestos touch
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const deltaX = e.touches[0].clientX - touchStartRef.current.x;
    const deltaY = e.touches[0].clientY - touchStartRef.current.y;

    // Swipe down para fechar
    if (deltaY > MIN_SWIPE_DISTANCE && Math.abs(deltaX) < Math.abs(deltaY)) {
      // Visual feedback pode ser adicionado aqui
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) {
      setIsPaused(false);
      return;
    }

    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;

    // Swipe down para fechar
    if (deltaY > MIN_SWIPE_DISTANCE && Math.abs(deltaX) < Math.abs(deltaY)) {
      onClose();
      return;
    }

    // Tap direita/esquerda
    if (Math.abs(deltaX) > MIN_SWIPE_DISTANCE && Math.abs(deltaY) < Math.abs(deltaX)) {
      if (deltaX > 0) {
        handlePrevious();
      } else {
        handleNext();
      }
    }

    touchStartRef.current = null;
    setIsPaused(false);
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
      // Centro: pausar/despausar
      setIsPaused(!isPaused);
    }
  };

  if (!currentStory || !currentUser) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Fundo com blur */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${currentStory.media_url})`,
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
          }}
        />

        {/* Overlay escuro */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Conteúdo */}
        <div
          className="relative w-full h-full flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleClick}
        >
          {/* Barra de progresso */}
          {currentStories.length > 0 && (
            <StoryProgress
              stories={currentStories}
              currentIndex={currentStoryIndex}
              progress={progress}
              isPaused={isPaused}
            />
          )}

          {/* Header com informações do usuário */}
          <div className="absolute top-12 left-0 right-0 z-50 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
                <img
                  src={currentUser.profile.avatar_url || '/placeholder.svg'}
                  alt={currentUser.profile.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-white font-medium">{currentUser.profile.name}</p>
                <p className="text-white/70 text-xs">{currentUser.profile.username}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Mídia */}
          <div className="relative w-full max-w-sm aspect-[9/16] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentUser.user_id}-${currentStory.id}`}
                className="absolute inset-0 rounded-lg overflow-hidden"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {currentStory.media_type === 'image' ? (
                  <img
                    src={currentStory.media_url}
                    alt="Story"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    src={currentStory.media_url}
                    className="w-full h-full object-contain"
                    playsInline
                    muted={false}
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        const video = videoRef.current;
                        if (video.duration && !isNaN(video.duration)) {
                          setVideoDuration(video.duration * 1000);
                          setIsVideoLoaded(true);
                        }
                      }
                    }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Indicadores de navegação (opcional, para desktop) */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-40">
            <button
              onClick={handlePrevious}
              className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors opacity-0 hover:opacity-100"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40">
            <button
              onClick={handleNext}
              className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors opacity-0 hover:opacity-100"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
