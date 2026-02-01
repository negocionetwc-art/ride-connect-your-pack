import { useEffect, useRef, useCallback } from 'react';
import type { UserStories } from './useStories';

interface PreloadedMedia {
  url: string;
  loaded: boolean;
  error: boolean;
}

// Cache global de mídia pré-carregada
const preloadCache = new Map<string, PreloadedMedia>();

export function useStoryPreloader(userStories: UserStories[]) {
  const preloadedUrls = useRef<Set<string>>(new Set());

  // Pré-carregar uma imagem
  const preloadImage = useCallback((url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // Verificar se já está no cache
      if (preloadCache.has(url)) {
        const cached = preloadCache.get(url)!;
        resolve(cached.loaded);
        return;
      }

      // Marcar como carregando
      preloadCache.set(url, { url, loaded: false, error: false });

      const img = new Image();
      
      img.onload = () => {
        preloadCache.set(url, { url, loaded: true, error: false });
        preloadedUrls.current.add(url);
        resolve(true);
      };
      
      img.onerror = () => {
        preloadCache.set(url, { url, loaded: false, error: true });
        resolve(false);
      };

      // Iniciar carregamento
      img.src = url;
    });
  }, []);

  // Pré-carregar um vídeo (apenas metadata)
  const preloadVideo = useCallback((url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (preloadCache.has(url)) {
        const cached = preloadCache.get(url)!;
        resolve(cached.loaded);
        return;
      }

      preloadCache.set(url, { url, loaded: false, error: false });

      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        preloadCache.set(url, { url, loaded: true, error: false });
        preloadedUrls.current.add(url);
        resolve(true);
      };
      
      video.onerror = () => {
        preloadCache.set(url, { url, loaded: false, error: true });
        resolve(false);
      };

      video.src = url;
    });
  }, []);

  // Verificar se uma URL está carregada
  const isLoaded = useCallback((url: string): boolean => {
    const cached = preloadCache.get(url);
    return cached?.loaded ?? false;
  }, []);

  // Pré-carregar stories visíveis
  useEffect(() => {
    if (!userStories || userStories.length === 0) return;

    const preloadStories = async () => {
      // Priorizar os primeiros 5 usuários (visíveis no topo)
      const priorityUsers = userStories.slice(0, 5);
      
      for (const userStory of priorityUsers) {
        // Pré-carregar primeiro story de cada usuário
        const firstStory = userStory.stories[0];
        if (!firstStory) continue;

        const url = firstStory.media_url;
        if (!url || preloadedUrls.current.has(url)) continue;

        if (firstStory.media_type === 'video') {
          await preloadVideo(url);
        } else {
          await preloadImage(url);
        }
      }

      // Depois pré-carregar o resto em background
      const remainingUsers = userStories.slice(5);
      
      for (const userStory of remainingUsers) {
        for (const story of userStory.stories) {
          const url = story.media_url;
          if (!url || preloadedUrls.current.has(url)) continue;

          if (story.media_type === 'video') {
            preloadVideo(url);
          } else {
            preloadImage(url);
          }
        }
      }
    };

    // Delay pequeno para não competir com render inicial
    const timer = setTimeout(preloadStories, 500);
    
    return () => clearTimeout(timer);
  }, [userStories, preloadImage, preloadVideo]);

  // Pré-carregar stories do próximo usuário quando abrir viewer
  const preloadUserStories = useCallback(async (userIndex: number) => {
    const user = userStories[userIndex];
    if (!user) return;

    // Pré-carregar todos os stories deste usuário
    for (const story of user.stories) {
      const url = story.media_url;
      if (!url || preloadedUrls.current.has(url)) continue;

      if (story.media_type === 'video') {
        await preloadVideo(url);
      } else {
        await preloadImage(url);
      }
    }

    // Pré-carregar primeiro story do próximo usuário
    const nextUser = userStories[userIndex + 1];
    if (nextUser?.stories[0]) {
      const nextUrl = nextUser.stories[0].media_url;
      if (nextUrl && !preloadedUrls.current.has(nextUrl)) {
        if (nextUser.stories[0].media_type === 'video') {
          preloadVideo(nextUrl);
        } else {
          preloadImage(nextUrl);
        }
      }
    }
  }, [userStories, preloadImage, preloadVideo]);

  return {
    isLoaded,
    preloadUserStories,
    preloadImage,
    preloadVideo,
  };
}

// Hook para usar no StoryViewer para verificar carregamento
export function useMediaLoaded(url: string, mediaType: 'image' | 'video') {
  const cached = preloadCache.get(url);
  return cached?.loaded ?? false;
}
