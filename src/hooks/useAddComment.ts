import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddCommentParams {
  postId: string;
  content: string;
}

export function useAddComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, content }: AddCommentParams) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Você precisa estar logado para comentar');
      }

      if (!content.trim()) {
        throw new Error('O comentário não pode estar vazio');
      }

      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim()
        })
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
        .single();

      if (error) throw error;
      
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidar queries para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['post-comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      
      toast({
        title: 'Comentário publicado!',
        description: 'Seu comentário foi adicionado com sucesso.'
      });
    },
    onError: (error: Error) => {
      console.error('Erro ao adicionar comentário:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível adicionar o comentário',
        variant: 'destructive'
      });
    }
  });
}
