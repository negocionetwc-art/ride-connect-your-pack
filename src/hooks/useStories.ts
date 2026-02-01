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
  text?: string;
  text_position?: 'top' | 'center' | 'bottom';
  text_color?: string;
  text_bg?: boolean;
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
      // Primeiro tentar com os novos campos, se falhar, tentar sem eles
      let storiesData: any[] | null = null;
      let storiesError: any = null;

      // Tentar buscar com campos novos primeiro
      const query1 = supabase
        .from('stories')
        .select(`
          id,
          user_id,
          media_url,
          media_type,
          image_url,
          text,
          text_position,
          text_color,
          text_bg,
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

      const result1 = await query1;
      storiesData = result1.data;
      storiesError = result1.error;

      // Se falhar por causa de campos que não existem, tentar sem eles
      if (storiesError && (storiesError.message?.includes('column') || storiesError.message?.includes('does not exist'))) {
        console.warn('Campos media_url/media_type não existem ainda. Buscando apenas com image_url.');
        const query2 = supabase
          .from('stories')
          .select(`
            id,
            user_id,
            image_url,
            text,
            text_position,
            text_color,
            text_bg,
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

        const result2 = await query2;
        storiesData = result2.data;
        storiesError = result2.error;
      }

      if (storiesError) {
        console.error('Erro ao buscar stories:', storiesError);
        return [];
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
      const storiesWithViews = storiesData.map((story: any) => {
        const profile = Array.isArray(story.profile) ? story.profile[0] : story.profile;
        const viewedAt = viewsMap.get(story.id);
        
        // Usar media_url se existir, senão usar image_url (compatibilidade)
        const mediaUrl = story.media_url || story.image_url || '';
        const mediaType = story.media_type || 'image';
        
        return {
          id: story.id,
          user_id: story.user_id,
          image_url: story.image_url || mediaUrl, // Manter compatibilidade
          media_url: mediaUrl,
          media_type: mediaType as 'image' | 'video',
          text: story.text || undefined,
          text_position: story.text_position || undefined,
          text_color: story.text_color || undefined,
          text_bg: story.text_bg || undefined,
          created_at: story.created_at,
          expires_at: story.expires_at,
          profile: profile,
          is_viewed: !!viewedAt,
          viewed_at: viewedAt || null,
        };
      }) as StoryWithProfile[];

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
