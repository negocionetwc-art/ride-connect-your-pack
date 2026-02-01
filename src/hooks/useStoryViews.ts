import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StoryView {
  id: string;
  viewer_id: string;
  viewed_at: string;
  profile: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
  };
}

export function useStoryViews(storyId?: string) {
  return useQuery({
    queryKey: ['story-views', storyId],
    queryFn: async (): Promise<{ views: StoryView[]; count: number }> => {
      if (!storyId) {
        return { views: [], count: 0 };
      }

      try {
        // Buscar visualizações (simplificado para evitar erros de foreign key)
        const { data, error, count } = await supabase
          .from('story_views')
          .select('id, viewer_id, viewed_at', { count: 'exact' })
          .eq('story_id', storyId)
          .order('viewed_at', { ascending: false });

        if (error) {
          console.error('Erro ao buscar visualizações:', error);
          return { views: [], count: 0 };
        }

        if (!data || data.length === 0) {
          return { views: [], count: 0 };
        }

        // Buscar perfis separadamente se necessário
        const viewerIds = [...new Set(data.map((v: any) => v.viewer_id))];
        
        if (viewerIds.length === 0) {
          return { views: [], count: count || 0 };
        }

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, username, avatar_url')
          .in('id', viewerIds);

        if (profilesError) {
          console.error('Erro ao buscar perfis:', profilesError);
        }

        const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));

        const views = data.map((view: any) => ({
          id: view.id,
          viewer_id: view.viewer_id,
          viewed_at: view.viewed_at,
          profile: profilesMap.get(view.viewer_id) || {
            id: view.viewer_id,
            name: '',
            username: '',
            avatar_url: null,
          },
        })) as StoryView[];

        return {
          views,
          count: count || views.length,
        };
      } catch (err) {
        console.error('Erro inesperado ao buscar visualizações:', err);
        return { views: [], count: 0 };
      }
    },
    enabled: !!storyId,
    retry: false,
  });
}
