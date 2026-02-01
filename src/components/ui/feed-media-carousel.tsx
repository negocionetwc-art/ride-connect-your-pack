import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Volume2, VolumeX } from 'lucide-react';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  aspectRatio?: number; // width / height
}

interface FeedMediaCarouselProps {
  images: string[];
  videos?: string[];
  alt?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * FeedMediaCarousel - Componente otimizado para exibição de mídia no feed
 * 
 * Características:
 * - Aspect ratio dinâmico baseado na primeira mídia (similar ao Instagram)
 * - object-fit: cover para preencher todo o espaço sem barras pretas
 * - Limites de proporção: vertical até 4:5, quadrado 1:1, horizontal até 16:9
 * - Suporte para múltiplas imagens com carousel
 * - Design mobile-first com transições suaves
 */
export const FeedMediaCarousel = ({ 
  images, 
  videos = [], 
  alt = 'Post media', 
  className = '',
  onClick
}: FeedMediaCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<number>(4/5); // Default: vertical (Instagram padrão)
  const [isLoading, setIsLoading] = useState(true);

  const allMedia: MediaItem[] = [
    ...images.map(url => ({ url, type: 'image' as const })),
    ...videos.map(url => ({ url, type: 'video' as const }))
  ];

  if (!allMedia || allMedia.length === 0) return null;

  // Calcular aspect ratio da primeira imagem
  useEffect(() => {
    const firstMedia = allMedia[0];
    if (firstMedia.type === 'image') {
      const img = new Image();
      img.onload = () => {
        let calculatedRatio = img.width / img.height;
        
        // Aplicar limites do Instagram
        // Vertical: máximo 4:5 (0.8)
        // Horizontal: máximo 16:9 (1.778)
        if (calculatedRatio < 0.8) {
          calculatedRatio = 0.8; // Forçar vertical máximo
        } else if (calculatedRatio > 1.91) {
          calculatedRatio = 1.91; // Forçar horizontal máximo (16:9)
        }
        
        setAspectRatio(calculatedRatio);
        setIsLoading(false);
      };
      img.onerror = () => {
        // Em caso de erro, usar proporção padrão
        setAspectRatio(1); // Quadrado
        setIsLoading(false);
      };
      img.src = firstMedia.url;
    } else {
      // Para vídeos, usar proporção padrão até carregar metadados
      setAspectRatio(9/16); // Vertical padrão para vídeos
      setIsLoading(false);
    }
  }, [allMedia[0].url]);

  const goToNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % allMedia.length);
  };

  const goToPrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
  };

  const goToIndex = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(index);
  };

  const currentMedia = allMedia[currentIndex];

  return (
    <div 
      className={`relative w-full overflow-hidden bg-secondary/20 ${className}`}
      style={{ 
        aspectRatio: aspectRatio.toString(),
        maxHeight: '600px', // Limite de altura para telas grandes
      }}
      onClick={onClick}
    >
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Mídia atual */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {currentMedia.type === 'image' ? (
            <img
              src={currentMedia.url}
              alt={`${alt} ${currentIndex + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <video
              src={currentMedia.url}
              className="w-full h-full object-cover"
              controls
              playsInline
              preload="metadata"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Controles de navegação (apenas se houver múltiplas mídias) */}
      {allMedia.length > 1 && (
        <>
          {/* Botões de navegação - aparecem no hover (desktop) */}
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10 hidden sm:block"
            aria-label="Mídia anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10 hidden sm:block"
            aria-label="Próxima mídia"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicadores de posição (dots) */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {allMedia.map((_, index) => (
              <button
                key={index}
                onClick={(e) => goToIndex(index, e)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-white w-6'
                    : 'bg-white/50 hover:bg-white/75 w-2'
                }`}
                aria-label={`Ir para mídia ${index + 1}`}
              />
            ))}
          </div>

          {/* Contador de mídias */}
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
            {currentIndex + 1} / {allMedia.length}
          </div>
        </>
      )}

      {/* Indicador de vídeo */}
      {currentMedia.type === 'video' && (
        <div className="absolute top-3 left-3 p-2 rounded-full bg-black/60 text-white backdrop-blur-sm">
          <Play className="w-4 h-4" />
        </div>
      )}

      {/* Gestos de swipe no mobile */}
      {allMedia.length > 1 && (
        <div
          className="absolute inset-0 touch-pan-y z-0"
          onTouchStart={(e) => {
            const touchStart = e.touches[0].clientX;
            const handleTouchEnd = (endEvent: TouchEvent) => {
              const touchEnd = endEvent.changedTouches[0].clientX;
              const diff = touchStart - touchEnd;
              
              if (Math.abs(diff) > 50) {
                if (diff > 0) {
                  goToNext();
                } else {
                  goToPrevious();
                }
              }
              
              document.removeEventListener('touchend', handleTouchEnd);
            };
            
            document.addEventListener('touchend', handleTouchEnd);
          }}
        />
      )}
    </div>
  );
};
