import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

interface PostMediaDetailProps {
  images: string[];
  videos?: string[];
  initialIndex?: number;
  alt?: string;
  onClose?: () => void;
  showControls?: boolean;
}

/**
 * PostMediaDetail - Componente para visualização ampliada/detalhada de mídia
 * 
 * Características:
 * - Fundo desfocado (blur) derivado da própria mídia
 * - Camada principal com object-fit: contain (visualizar imagem completa)
 * - Nunca usa fundo preto sólido
 * - Controles completos de navegação
 * - Suporte para zoom (futuro)
 * - Design imersivo e profissional
 */
export const PostMediaDetail = ({ 
  images, 
  videos = [],
  initialIndex = 0,
  alt = 'Post media',
  onClose,
  showControls = true
}: PostMediaDetailProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const allMedia: MediaItem[] = [
    ...images.map(url => ({ url, type: 'image' as const })),
    ...videos.map(url => ({ url, type: 'video' as const }))
  ];

  if (!allMedia || allMedia.length === 0) return null;

  const currentMedia = allMedia[currentIndex];

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % allMedia.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Reset video controls quando mudar de mídia
  useEffect(() => {
    if (currentMedia.type === 'video') {
      setIsPlaying(false);
    }
  }, [currentIndex]);

  // Suporte para teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === ' ' && currentMedia.type === 'video') {
        e.preventDefault();
        handlePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isPlaying]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Fundo borrado - usando a mídia atual como base */}
      <div className="absolute inset-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            {currentMedia.type === 'image' ? (
              <img
                src={currentMedia.url}
                alt="background blur"
                className="w-full h-full object-cover scale-110 blur-3xl brightness-50"
                aria-hidden="true"
              />
            ) : (
              <video
                src={currentMedia.url}
                className="w-full h-full object-cover scale-110 blur-3xl brightness-50"
                muted
                autoPlay
                loop
                playsInline
                aria-hidden="true"
              />
            )}
            {/* Overlay escuro adicional */}
            <div className="absolute inset-0 bg-black/30" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Conteúdo principal */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        {/* Mídia atual - object-fit: contain */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="relative max-w-full max-h-full flex items-center justify-center"
          >
            {currentMedia.type === 'image' ? (
              <img
                src={currentMedia.url}
                alt={`${alt} ${currentIndex + 1}`}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
            ) : (
              <div className="relative">
                <video
                  ref={videoRef}
                  src={currentMedia.url}
                  className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                  controls={false}
                  playsInline
                  preload="metadata"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                
                {/* Controles de vídeo customizados */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 bg-black/70 rounded-full backdrop-blur-sm">
                  <button
                    onClick={handlePlayPause}
                    className="text-white hover:text-primary transition-colors"
                    aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  
                  <button
                    onClick={handleMuteToggle}
                    className="text-white hover:text-primary transition-colors"
                    aria-label={isMuted ? 'Ativar som' : 'Desativar som'}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Controles de navegação */}
        {showControls && (
          <>
            {/* Botão fechar */}
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm z-10"
                aria-label="Fechar"
              >
                <X className="w-6 h-6" />
              </button>
            )}

            {/* Navegação entre mídias (se houver múltiplas) */}
            {allMedia.length > 1 && (
              <>
                {/* Botão anterior */}
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm z-10"
                  aria-label="Mídia anterior"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                {/* Botão próximo */}
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm z-10"
                  aria-label="Próxima mídia"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Indicadores de posição */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {allMedia.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToIndex(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentIndex
                          ? 'bg-white w-8'
                          : 'bg-white/50 hover:bg-white/75 w-2'
                      }`}
                      aria-label={`Ir para mídia ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Contador */}
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/50 text-white text-sm font-medium backdrop-blur-sm">
                  {currentIndex + 1} / {allMedia.length}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Click fora para fechar */}
      {onClose && (
        <div
          className="absolute inset-0 -z-10"
          onClick={onClose}
          aria-label="Fechar visualização"
        />
      )}
    </motion.div>
  );
};
