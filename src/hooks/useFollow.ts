import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FollowUserParams {
  userId: string; // ID do usuário a ser seguido
  isFollowing: boolean; // true se já está seguindo (para deseguir)
}

export function useFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isFollowing }: FollowUserParams) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Você precisa estar logado para seguir usuários');
      }

      if (user.id === userId) {
        throw new Error('Você não pode seguir a si mesmo');
      }

      if (isFollowing) {
        // Deseguir - remover o follow
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) throw error;
      } else {
        // Seguir - adicionar follow
        const { error } = await supabase
          .from('user_follows')
          .insert({ 
            follower_id: user.id, 
            following_id: userId 
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
      queryClient.invalidateQueries({ queryKey: ['follow-status', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['profile', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['profile'] }); // Para atualizar contadores no próprio perfil
      
      toast({
        title: variables.isFollowing ? 'Deixou de seguir' : 'Agora você está seguindo',
        description: variables.isFollowing 
          ? 'Você deixou de seguir este usuário' 
          : 'Você começou a seguir este usuário',
      });
    },
    onError: (error: Error) => {
      console.error('Erro ao seguir/deseguir usuário:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível processar a ação',
        variant: 'destructive'
      });
    }
  });
}
