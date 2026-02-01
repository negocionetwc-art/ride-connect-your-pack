import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    level: number;
  };
}

export function usePostComments(postId: string) {
  return useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          id,
          post_id,
          user_id,
          content,
          created_at,
          profile:profiles!post_comments_user_id_fkey (
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
        console.error('Erro ao buscar comentários:', error);
        throw error;
      }

      return data as PostComment[];
    },
    enabled: !!postId
  });
}
