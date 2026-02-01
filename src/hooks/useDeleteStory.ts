import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DeleteStoryParams {
  storyId: string;
}

export function useDeleteStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storyId }: DeleteStoryParams) => {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidar cache de stories
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['current-user-story'] });
      
      toast({
        title: 'Story excluído',
        description: 'Seu story foi excluído com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir story',
        description: error.message || 'Não foi possível excluir o story.',
        variant: 'destructive',
      });
    },
  });
}
