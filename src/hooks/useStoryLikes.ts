import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useStoryLikes(storyId: string) {
  const queryClient = useQueryClient();

  // Buscar likes do story e verificar se usuário curtiu
  const query = useQuery({
    queryKey: ['story-likes', storyId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Contar total de likes
      const { count } = await (supabase
        .from('story_likes') as any)
        .select('*', { count: 'exact', head: true })
        .eq('story_id', storyId);

      // Verificar se o usuário atual curtiu
      let isLiked = false;
      if (user) {
        const { data: userLike } = await (supabase
          .from('story_likes') as any)
          .select('id')
          .eq('story_id', storyId)
          .eq('user_id', user.id)
          .maybeSingle();
        isLiked = !!userLike;
      }

      return {
        count: count || 0,
        isLiked,
      };
    },
    enabled: !!storyId,
    staleTime: 5000,
  });

  // Mutation para curtir/descurtir
  const toggleLike = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data: existingLike } = await (supabase
        .from('story_likes') as any)
        .select('id')
        .eq('story_id', storyId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingLike) {
        // Remover curtida
        await (supabase
          .from('story_likes') as any)
          .delete()
          .eq('id', existingLike.id);
        return { action: 'unliked' };
      } else {
        // Adicionar curtida
        await (supabase
          .from('story_likes') as any)
          .insert({
            story_id: storyId,
            user_id: user.id,
          });
        return { action: 'liked' };
      }
    },
    onMutate: async () => {
      // Cancelar queries pendentes
      await queryClient.cancelQueries({ queryKey: ['story-likes', storyId] });

      // Snapshot do valor anterior
      const previousData = queryClient.getQueryData(['story-likes', storyId]);

      // Otimistic update
      queryClient.setQueryData(['story-likes', storyId], (old: any) => ({
        count: old?.isLiked ? (old?.count || 1) - 1 : (old?.count || 0) + 1,
        isLiked: !old?.isLiked,
      }));

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // Reverter em caso de erro
      if (context?.previousData) {
        queryClient.setQueryData(['story-likes', storyId], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['story-likes', storyId] });
    },
  });

  return {
    likesCount: query.data?.count || 0,
    isLiked: query.data?.isLiked || false,
    isLoading: query.isLoading,
    toggleLike: toggleLike.mutate,
    isToggling: toggleLike.isPending,
  };
}
