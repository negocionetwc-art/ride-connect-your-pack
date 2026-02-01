import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PostLiker {
  id: string;
  created_at: string;
  profile: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    level: number;
  };
}

export function usePostLikers(postId: string) {
  return useQuery({
    queryKey: ['post-likers', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_likes')
        .select(`
          id,
          created_at,
          profile:profiles!post_likes_user_id_fkey (
            id,
            name,
            username,
            avatar_url,
            level
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar curtidas:', error);
        throw error;
      }

      return data as PostLiker[];
    },
    enabled: !!postId
  });
}
