import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StoryComment {
  id: string;
  story_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
  };
}

export function useStoryComments(storyId: string) {
  const queryClient = useQueryClient();

  // Buscar comentários do story
  const query = useQuery({
    queryKey: ['story-comments', storyId],
    queryFn: async (): Promise<StoryComment[]> => {
      const { data, error } = await (supabase
        .from('story_comments') as any)
        .select(`
          id,
          story_id,
          user_id,
          content,
          created_at,
          profile:profiles!story_comments_user_id_fkey (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .eq('story_id', storyId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erro ao buscar comentários:', error);
        return [];
      }

      return (data || []).map((comment: any) => ({
        ...comment,
        profile: Array.isArray(comment.profile) ? comment.profile[0] : comment.profile,
      }));
    },
    enabled: !!storyId,
    staleTime: 10000,
  });

  // Mutation para adicionar comentário
  const addComment = useMutation({
    mutationFn: async (content: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await (supabase
        .from('story_comments') as any)
        .insert({
          story_id: storyId,
          user_id: user.id,
          content: content.trim(),
        })
        .select(`
          id,
          story_id,
          user_id,
          content,
          created_at,
          profile:profiles!story_comments_user_id_fkey (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-comments', storyId] });
    },
  });

  // Mutation para deletar comentário
  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await (supabase
        .from('story_comments') as any)
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-comments', storyId] });
    },
  });

  return {
    comments: query.data || [],
    commentsCount: query.data?.length || 0,
    isLoading: query.isLoading,
    addComment: addComment.mutate,
    isAddingComment: addComment.isPending,
    deleteComment: deleteComment.mutate,
    isDeletingComment: deleteComment.isPending,
    refetch: query.refetch,
  };
}
