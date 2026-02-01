import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UpdatePostParams {
  postId: string;
  caption: string;
}

export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, caption }: UpdatePostParams) => {
      const { error } = await supabase
        .from('posts')
        .update({ 
          caption,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidar cache de posts
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile-posts'] });
      
      toast({
        title: 'Post atualizado',
        description: 'A legenda foi atualizada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar post',
        description: error.message || 'Não foi possível atualizar o post.',
        variant: 'destructive',
      });
    },
  });
};
