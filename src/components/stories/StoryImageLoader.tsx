import { useState, useEffect, memo, useCallback, useRef } from 'react';

interface StoryImageLoaderProps {
  src: string;
  alt?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// Componente memoizado para evitar re-renders desnecessários
export const StoryImageLoader = memo(function StoryImageLoader({
  src,
  alt = 'Story',
  className = '',
  onLoad,
  onError,
}: StoryImageLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [src, onLoad, onError]);

  // Importante: usar o onLoad do elemento <img> (e não um preloader separado)
  // evita “double-load”/race conditions que costumam causar flicker em mobile.
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  }, [onError]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Imagem - usar CSS para transição ao invés de framer-motion */}
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${className}`}
        style={{ willChange: 'opacity' }}
        loading="eager"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* Estado de erro */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-2">
          <div className="text-muted-foreground text-sm">Não foi possível carregar</div>
        </div>
      )}
    </div>
  );
});

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

export const StoryVideoLoader = memo(function StoryVideoLoader({
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
  const [posterUrl, setPosterUrl] = useState<string | null>(null);

  // UPGRADE 8: Gerar poster do primeiro frame
  useEffect(() => {
    if (!src || !videoRef?.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const handleLoadedMetadata = () => {
      if (video.videoWidth && video.videoHeight && ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const poster = canvas.toDataURL('image/jpeg', 0.8);
        setPosterUrl(poster);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [src, videoRef]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Skeleton/Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Vídeo */}
      <video
        ref={videoRef}
        src={src}
        poster={posterUrl || undefined}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${className}`}
        playsInline
        muted={false}
        preload="auto"
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
});
