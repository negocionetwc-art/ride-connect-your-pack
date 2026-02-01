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

      // Buscar visualizações com perfis
      const { data, error } = await supabase
        .from('story_views')
        .select(`
          id,
          viewer_id,
          viewed_at,
          profile:profiles!story_views_viewer_id_fkey (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .eq('story_id', storyId)
        .order('viewed_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar visualizações:', error);
        return { views: [], count: 0 };
      }

      const views = (data || []).map((view: any) => ({
        id: view.id,
        viewer_id: view.viewer_id,
        viewed_at: view.viewed_at,
        profile: Array.isArray(view.profile) ? view.profile[0] : view.profile,
      })) as StoryView[];

      return {
        views,
        count: views.length,
      };
    },
    enabled: !!storyId,
  });
}
