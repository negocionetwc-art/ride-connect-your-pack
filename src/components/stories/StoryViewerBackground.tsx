import { memo, useMemo } from 'react';

interface StoryViewerBackgroundProps {
  /** URL já liberada pelo gate (só muda quando o story muda) */
  url?: string;
}

/**
 * Fundo com blur memoizado para NÃO repintar a cada update de progresso.
 * Re-renderiza apenas quando a URL muda.
 */
export const StoryViewerBackground = memo(function StoryViewerBackground({
  url,
}: StoryViewerBackgroundProps) {
  const style = useMemo(() => {
    if (!url) return undefined;
    return {
      backgroundImage: `url(${url})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      filter: 'blur(40px) brightness(0.4)',
      transform: 'scale(1.2)',
    } as const;
  }, [url]);

  if (!url) return null;

  return <div className="absolute inset-0 will-change-transform" style={style} />;
});
