import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LikePostParams {
  postId: string;
  isLiked: boolean;
}

export function useLikePost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, isLiked }: LikePostParams) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Você precisa estar logado para curtir posts');
      }

      if (isLiked) {
        // Descurtir - remover a curtida
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Curtir - adicionar curtida
        const { error } = await supabase
          .from('post_likes')
          .insert({ 
            post_id: postId, 
            user_id: user.id 
          });

        if (error) {
          // Se já existe (erro de constraint unique), ignorar
          if (error.code === '23505') {
            return;
          }
          throw error;
        }
      }
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['post-likes', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['post-likers', variables.postId] });
    },
    onError: (error: Error) => {
      console.error('Erro ao curtir/descurtir post:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível processar a curtida',
        variant: 'destructive'
      });
    }
  });
}
