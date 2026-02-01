import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePostLikes(postId: string) {
  return useQuery({
    queryKey: ['post-likes', postId],
    queryFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return {
          isLiked: false,
          likeId: null
        };
      }
      
      // Verificar se o usuário curtiu este post
      const { data: userLike, error } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Erro ao verificar curtida:', error);
        return {
          isLiked: false,
          likeId: null
        };
      }
      
      return {
        isLiked: !!userLike,
        likeId: userLike?.id || null
      };
    },
    enabled: !!postId
  });
}
