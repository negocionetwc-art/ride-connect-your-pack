import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, MoreVertical, Trash2 } from 'lucide-react';
import { StoryProgress } from './StoryProgress';
import { StoryImageLoader, StoryVideoLoader } from './StoryImageLoader';
import { StoryInteractions } from './StoryInteractions';
import { useStoryView } from '@/hooks/useStoryView';
import { useStoryPreloader } from '@/hooks/useStoryPreloader';
import { useStoryMediaGate } from '@/hooks/useStoryMediaGate';
import { useDeleteStory } from '@/hooks/useDeleteStory';
import { StoryViewerBackground } from './StoryViewerBackground';
import { StoryTextOverlay } from './StoryTextOverlay';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { UserStories } from '@/hooks/useStories';

interface StoryViewerProps {
  userStories: UserStories[];
  initialUserIndex: number;
  initialStoryIndex: number;
  onClose: () => void;
}

const IMAGE_DURATION = 5000;
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
  const [videoDuration, setVideoDuration] = useState(IMAGE_DURATION);
  const [isInteractionPaused, setIsInteractionPaused] = useState(false);
  const [isLayoutStable, setIsLayoutStable] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { mutate: markAsViewed } = useStoryView();
  const { preloadUserStories } = useStoryPreloader(userStories);
  const deleteStoryMutation = useDeleteStory();

  // Obter ID do usuário atual
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Memoize current story data para evitar re-renders
  const currentUser = useMemo(() => userStories[currentUserIndex], [userStories, currentUserIndex]);
  const currentStories = useMemo(() => currentUser?.stories || [], [currentUser]);
  const currentStory = useMemo(() => currentStories[currentStoryIndex], [currentStories, currentStoryIndex]);

  // 1) PRÉ-CARREGAMENTO REAL: só libera a URL para render após load (Image.onload / video.onloadeddata)
  const mediaGate = useStoryMediaGate({
    url: currentStory?.media_url,
    mediaType: currentStory?.media_type,
  });

  const isMediaReady = mediaGate.isReady;
  const mediaSrc = mediaGate.displayUrl;

  // 5) Só iniciar progresso após load + layout estabilizar
  useEffect(() => {
    setIsLayoutStable(false);
    if (!isMediaReady) return;
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => setIsLayoutStable(true));
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, [isMediaReady, currentStory?.id]);

  // Pré-carregar stories quando mudar de usuário
  useEffect(() => {
    preloadUserStories(currentUserIndex);
  }, [currentUserIndex, preloadUserStories]);

  // Navegação otimizada
  const handleNext = useCallback(() => {
    if (currentStoryIndex < currentStories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else if (currentUserIndex < userStories.length - 1) {
      setCurrentUserIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      onClose();
      return;
    }
    setProgress(0);
  }, [currentStoryIndex, currentStories.length, currentUserIndex, userStories.length, onClose]);

  const handlePrevious = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else if (currentUserIndex > 0) {
      const prevUser = userStories[currentUserIndex - 1];
      setCurrentUserIndex(prev => prev - 1);
      setCurrentStoryIndex(prevUser.stories.length - 1);
    }
    setProgress(0);
  }, [currentStoryIndex, currentUserIndex, userStories]);

  // Callback quando o elemento final (<video>) expõe metadata (duração)
  const handleFinalMediaMounted = useCallback(() => {
    if (currentStory?.media_type === 'video' && videoRef.current) {
      const video = videoRef.current;
      if (video.duration && !isNaN(video.duration)) {
        setVideoDuration(video.duration * 1000);
      }
    } else {
      setVideoDuration(IMAGE_DURATION);
    }
  }, [currentStory?.media_type]);

  // Marcar como visto
  useEffect(() => {
    if (currentStory && !currentStory.is_viewed) {
      markAsViewed(currentStory.id);
    }
  }, [currentStory, markAsViewed]);

  // Progresso automático - otimizado com requestAnimationFrame
  useEffect(() => {
    const shouldProgress = currentStory && 
      !isPaused && 
      !isInteractionPaused && 
      isMediaReady &&
      isLayoutStable &&
      currentStory.media_type !== 'video';

    if (!shouldProgress) {
      if (progressIntervalRef.current) {
        cancelAnimationFrame(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    setProgress(0);
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const newProgress = (elapsed / videoDuration) * 100;
      
      if (newProgress >= 100) {
        setProgress(100);
        handleNext();
      } else {
        setProgress(newProgress);
        progressIntervalRef.current = requestAnimationFrame(animate);
      }
    };

    progressIntervalRef.current = requestAnimationFrame(animate);

    return () => {
      if (progressIntervalRef.current) {
        cancelAnimationFrame(progressIntervalRef.current);
      }
    };
   }, [currentStory, isPaused, isInteractionPaused, isMediaReady, isLayoutStable, videoDuration, handleNext]);

  // Controlar vídeo
  useEffect(() => {
    if (currentStory?.media_type === 'video' && videoRef.current && isMediaReady && isLayoutStable) {
      if (isPaused || isInteractionPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
    }
  }, [isPaused, isInteractionPaused, isMediaReady, isLayoutStable, currentStory?.media_type]);

  // Handle de progresso de vídeo
  const handleVideoTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      if (video.duration && !isNaN(video.duration)) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    }
  }, []);

  // Gestos touch otimizados para mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
    setIsPaused(true);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) {
      setIsPaused(false);
      return;
    }

    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Swipe para baixo fecha
    if (deltaY > MIN_SWIPE_DISTANCE && Math.abs(deltaX) < Math.abs(deltaY)) {
      onClose();
      return;
    }

    // Swipe horizontal navega
    if (Math.abs(deltaX) > MIN_SWIPE_DISTANCE && Math.abs(deltaY) < Math.abs(deltaX)) {
      if (deltaX > 0) {
        handlePrevious();
      } else {
        handleNext();
      }
      touchStartRef.current = null;
      setIsPaused(false);
      return;
    }

    // Tap rápido navega
    if (deltaTime < 200 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const clickX = e.changedTouches[0].clientX - rect.left;
        if (clickX < rect.width / 3) {
          handlePrevious();
        } else if (clickX > (rect.width * 2) / 3) {
          handleNext();
        }
      }
    }

    touchStartRef.current = null;
    setIsPaused(false);
  }, [handleNext, handlePrevious, onClose]);

  // Click para desktop
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    
    if (clickX < width / 3) {
      handlePrevious();
    } else if (clickX > (width * 2) / 3) {
      handleNext();
    } else {
      setIsPaused(prev => !prev);
    }
  }, [handleNext, handlePrevious]);

  // Callbacks para interações
  const handleInteractionPause = useCallback(() => {
    setIsInteractionPaused(true);
  }, []);

  const handleInteractionResume = useCallback(() => {
    setIsInteractionPaused(false);
  }, []);

  // Verificar se é o próprio story
  const isOwnStory = useMemo(() => {
    return currentStory?.user_id === currentUserId;
  }, [currentStory?.user_id, currentUserId]);

  // Handler para excluir story
  const handleDeleteStory = useCallback(() => {
    if (!currentStory) return;
    
    deleteStoryMutation.mutate(
      { storyId: currentStory.id },
      {
        onSuccess: () => {
          setShowDeleteDialog(false);
          // Se houver mais stories, ir para o próximo, senão fechar
          if (currentStories.length > 1) {
            if (currentStoryIndex < currentStories.length - 1) {
              setCurrentStoryIndex(prev => prev + 1);
            } else if (currentStoryIndex > 0) {
              setCurrentStoryIndex(prev => prev - 1);
            } else {
              onClose();
            }
          } else {
            // Se era o último story do usuário, fechar
            onClose();
          }
        },
      }
    );
  }, [currentStory, currentStories.length, currentStoryIndex, deleteStoryMutation, onClose]);

  if (!currentStory || !currentUser) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        // 3) ALTURA CORRETA NO MOBILE: 100svh (via util) evita resize/flicker do 100vh
        className="fixed left-0 top-0 z-50 w-screen h-screen-safe flex items-center justify-center bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {/* 4) BLUR SEM REPROCESSAMENTO: memoizado e só muda quando a URL muda */}
        <StoryViewerBackground url={isMediaReady ? mediaSrc : undefined} />

        {/* Conteúdo principal */}
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
              isPaused={isPaused || isInteractionPaused || !isMediaReady || !isLayoutStable}
            />
          )}

          {/* Header */}
          <div className="absolute top-12 left-0 right-0 z-50 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50">
                <img
                  src={currentUser.profile.avatar_url || '/placeholder.svg'}
                  alt={currentUser.profile.name}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
              <div>
                <p className="text-white font-medium text-shadow">{currentUser.profile.name}</p>
                <p className="text-white/70 text-xs">@{currentUser.profile.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Menu de opções para próprio story */}
              {isOwnStory && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-white" />
                    </motion.button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-sm">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteDialog(true);
                      }}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir story
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Mídia - container fixo para evitar layout shift */}
          <div
            className="relative w-full max-w-sm mx-auto"
            style={{
              height: 'calc(100svh - 120px)',
              maxHeight: '700px',
              aspectRatio: '9 / 16',
            }}
          >
            <div className="absolute inset-0 rounded-2xl overflow-hidden bg-black">
              {/* Skeleton sempre visível até carregar */}
              {!isMediaReady && (
                <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center z-20">
                  <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
              
              {/* Mídia - nunca desmonta, só muda opacity */}
              <div className="absolute inset-0">
                {currentStory.media_type === 'image' ? (
                  <StoryImageLoader
                    src={mediaSrc || ''}
                    alt="Story"
                    onLoad={handleFinalMediaMounted}
                    className={isMediaReady ? 'opacity-100' : 'opacity-0'}
                  />
                ) : (
                  <StoryVideoLoader
                    src={mediaSrc || ''}
                    videoRef={videoRef}
                    onLoad={handleFinalMediaMounted}
                    onTimeUpdate={handleVideoTimeUpdate}
                    onEnded={handleNext}
                    className={isMediaReady ? 'opacity-100' : 'opacity-0'}
                  />
                )}
              </div>

              {/* Texto sobre o story */}
              <StoryTextOverlay
                text={currentStory.text}
                position={currentStory.text_position}
                color={currentStory.text_color}
                bg={currentStory.text_bg}
                yPercent={currentStory.text_y_percent}
              />
            </div>
          </div>

          {/* Interações (like/comment) */}
          <StoryInteractions
            storyId={currentStory.id}
            onPause={handleInteractionPause}
            onResume={handleInteractionResume}
          />

          {/* Navegação desktop */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-all opacity-0 hover:opacity-100 hidden md:block"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-all opacity-0 hover:opacity-100 hidden md:block"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>
      </motion.div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir story?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O story será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteStory();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteStoryMutation.isPending}
            >
              {deleteStoryMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AnimatePresence>
  );
}
