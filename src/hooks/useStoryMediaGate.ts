import { useEffect, useMemo, useState } from 'react';

type MediaType = 'image' | 'video';

export type StoryMediaGateStatus = 'idle' | 'loading' | 'ready' | 'error';

interface UseStoryMediaGateArgs {
  url?: string | null;
  mediaType?: MediaType;
}

/**
 * Gate de preload REAL antes de renderizar a mídia principal.
 *
 * Objetivo:
 * - no mobile, evitar flicker/"double paint" renderizando o <img>/<video> só após
 *   a mídia estar pronta (Image.onload / video.onloadeddata).
 * - quando troca o story, reseta para skeleton e só libera a src após preload.
 */
export function useStoryMediaGate({ url, mediaType }: UseStoryMediaGateArgs) {
  const [status, setStatus] = useState<StoryMediaGateStatus>('idle');
  const [displayUrl, setDisplayUrl] = useState<string>('');

  const normalizedUrl = useMemo(() => url ?? '', [url]);

  useEffect(() => {
    if (!normalizedUrl || !mediaType) {
      setStatus('idle');
      setDisplayUrl('');
      return;
    }

    let cancelled = false;

    setStatus('loading');
    setDisplayUrl('');

    if (mediaType === 'image') {
      const img = new Image();
      // ajuda a decodificação assíncrona, reduzindo trabalho no main-thread
      // quando a imagem for finalmente renderizada.
      img.decoding = 'async';

      img.onload = async () => {
        try {
          // decode garante que a imagem esteja realmente pronta pra pintar
          // (quando suportado), reduzindo flicker.
          const anyImg = img as unknown as { decode?: () => Promise<void> };
          if (typeof anyImg.decode === 'function') {
            await anyImg.decode();
          }
        } catch {
          // decode pode falhar em alguns casos; onload já é suficiente.
        }
        if (cancelled) return;
        setDisplayUrl(normalizedUrl);
        setStatus('ready');
      };

      img.onerror = () => {
        if (cancelled) return;
        setStatus('error');
      };

      img.src = normalizedUrl;

      return () => {
        cancelled = true;
        img.onload = null;
        img.onerror = null;
      };
    }

    // mediaType === 'video'
    const video = document.createElement('video');
    video.preload = 'auto';
    video.playsInline = true;
    video.muted = true; // evita bloqueio de autoplay durante preload

    video.onloadeddata = () => {
      if (cancelled) return;
      setDisplayUrl(normalizedUrl);
      setStatus('ready');
    };

    video.onerror = () => {
      if (cancelled) return;
      setStatus('error');
    };

    video.src = normalizedUrl;
    try {
      video.load();
    } catch {
      // ignore
    }

    return () => {
      cancelled = true;
      video.onloadeddata = null;
      video.onerror = null;
      try {
        video.src = '';
      } catch {
        // ignore
      }
    };
  }, [normalizedUrl, mediaType]);

  return {
    status,
    displayUrl,
    isReady: status === 'ready',
    isLoading: status === 'loading',
    hasError: status === 'error',
  };
}
