import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useStoryView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storyId: string): Promise<void> => {
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar se já foi visualizado
      const { data: existingView } = await supabase
        .from('story_views')
        .select('id')
        .eq('story_id', storyId)
        .eq('viewer_id', user.id)
        .single();

      // Se já foi visualizado, não fazer nada
      if (existingView) {
        return;
      }

      // Inserir visualização
      const { error } = await supabase
        .from('story_views')
        .insert({
          story_id: storyId,
          viewer_id: user.id,
        });

      if (error) {
        console.error('Erro ao marcar story como visto:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidar queries de stories para atualizar UI
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}
