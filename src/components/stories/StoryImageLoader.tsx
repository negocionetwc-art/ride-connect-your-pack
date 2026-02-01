import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface StoryImageLoaderProps {
  src: string;
  alt?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function StoryImageLoader({
  src,
  alt = 'Story',
  className = '',
  onLoad,
  onError,
}: StoryImageLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setImageSrc(null);

    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      onLoad?.();
    };
    
    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
      onError?.();
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, onLoad, onError]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Skeleton/Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
        </div>
      )}

      {/* Imagem carregada */}
      {imageSrc && !hasError && (
        <motion.img
          src={imageSrc}
          alt={alt}
          className="w-full h-full object-contain"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Estado de erro */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-2">
          <div className="text-muted-foreground text-sm">Não foi possível carregar</div>
        </div>
      )}
    </div>
  );
}

// Componente para vídeo com loading
interface StoryVideoLoaderProps {
  src: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
  onTimeUpdate?: () => void;
  onEnded?: () => void;
}

export function StoryVideoLoader({
  src,
  className = '',
  onLoad,
  onError,
  videoRef,
  onTimeUpdate,
  onEnded,
}: StoryVideoLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Skeleton/Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse z-10">
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
        </div>
      )}

      {/* Vídeo */}
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        playsInline
        muted={false}
        onLoadedMetadata={() => {
          setIsLoading(false);
          onLoad?.();
        }}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
          onError?.();
        }}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
      />

      {/* Estado de erro */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-2 z-10">
          <div className="text-muted-foreground text-sm">Não foi possível carregar o vídeo</div>
        </div>
      )}
    </div>
  );
}
