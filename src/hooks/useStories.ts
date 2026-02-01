import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Story = Database['public']['Tables']['stories']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export type StoryWithProfile = Story & {
  profile: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
  };
  is_viewed: boolean;
  viewed_at: string | null;
};

export type UserStories = {
  user_id: string;
  profile: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
  };
  stories: StoryWithProfile[];
  has_unviewed: boolean;
};

export function useStories() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  // Obter ID do usuário atual
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Query para buscar stories
  const query = useQuery({
    queryKey: ['stories', userId],
    queryFn: async (): Promise<UserStories[]> => {
      if (!userId) return [];

      // Buscar stories ativos com perfis e status de visualização
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select(`
          id,
          user_id,
          media_url,
          media_type,
          image_url,
          created_at,
          expires_at,
          profile:profiles!stories_user_id_fkey (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (storiesError) {
        console.error('Erro ao buscar stories:', storiesError);
        // Se o erro for relacionado a campos que não existem, retornar array vazio
        if (storiesError.message?.includes('column') || storiesError.message?.includes('does not exist')) {
          console.warn('Campos de stories ainda não foram migrados. Retornando array vazio.');
          return [];
        }
        throw storiesError;
      }

      if (!storiesData || storiesData.length === 0) {
        return [];
      }

      // Buscar visualizações do usuário atual
      const storyIds = storiesData.map(s => s.id);
      const { data: viewsData } = await supabase
        .from('story_views')
        .select('story_id, viewed_at')
        .eq('viewer_id', userId)
        .in('story_id', storyIds);

      // Criar mapa de visualizações
      const viewsMap = new Map<string, string>();
      viewsData?.forEach(view => {
        viewsMap.set(view.story_id, view.viewed_at);
      });

      // Adicionar status de visualização aos stories
      const storiesWithViews: StoryWithProfile[] = storiesData.map(story => {
        const profile = Array.isArray(story.profile) ? story.profile[0] : story.profile;
        const viewedAt = viewsMap.get(story.id);
        
        // Usar media_url se existir, senão usar image_url (compatibilidade)
        const mediaUrl = (story as any).media_url || (story as any).image_url || '';
        const mediaType = (story as any).media_type || 'image';
        
        return {
          ...story,
          media_url: mediaUrl,
          media_type: mediaType as 'image' | 'video',
          profile: profile as Profile,
          is_viewed: !!viewedAt,
          viewed_at: viewedAt || null,
        };
      });

      // Agrupar stories por usuário
      const storiesByUser = new Map<string, StoryWithProfile[]>();
      storiesWithViews.forEach(story => {
        if (!storiesByUser.has(story.user_id)) {
          storiesByUser.set(story.user_id, []);
        }
        storiesByUser.get(story.user_id)!.push(story);
      });

      // Converter para array e ordenar
      const userStories: UserStories[] = Array.from(storiesByUser.entries()).map(([user_id, stories]) => {
        const firstStory = stories[0];
        const profile = firstStory.profile;
        const has_unviewed = stories.some(s => !s.is_viewed);

        // Ordenar stories do usuário por created_at (mais recente primeiro)
        const sortedStories = [...stories].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return {
          user_id,
          profile,
          stories: sortedStories,
          has_unviewed,
        };
      });

      // Ordenar: não vistos primeiro, depois vistos
      userStories.sort((a, b) => {
        if (a.has_unviewed && !b.has_unviewed) return -1;
        if (!a.has_unviewed && b.has_unviewed) return 1;
        return 0;
      });

      return userStories;
    },
    enabled: !!userId,
    refetchOnWindowFocus: false,
  });

  // Configurar Realtime para atualizações automáticas
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('stories-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories',
          filter: `expires_at=gt.${new Date().toISOString()}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['stories', userId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'story_views',
          filter: `viewer_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['stories', userId] });
        }
      )
      .subscribe((status) => {
        console.log('Status da subscription de stories:', status);
      });

    return () => {
      channel.unsubscribe();
    };
  }, [userId, queryClient]);

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
