import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeleteCommentParams {
  commentId: string;
  postId: string;
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ commentId }: DeleteCommentParams) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Você precisa estar logado para deletar comentários');
      }

      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id); // Apenas o próprio usuário pode deletar

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      
      toast({
        title: 'Comentário excluído',
        description: 'Seu comentário foi removido com sucesso.'
      });
    },
    onError: (error: Error) => {
      console.error('Erro ao deletar comentário:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir o comentário',
        variant: 'destructive'
      });
    }
  });
}
