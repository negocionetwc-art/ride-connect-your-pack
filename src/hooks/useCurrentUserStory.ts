import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useCurrentUserStory() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const query = useQuery({
    queryKey: ['current-user-story', userId],
    queryFn: async () => {
      if (!userId) return { hasActiveStory: false, stories: [] };

      // Buscar stories ativos do usuário atual
      const { data, error } = await supabase
        .from('stories')
        .select('id, created_at, expires_at, media_url, media_type')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar stories do usuário:', error);
        return { hasActiveStory: false, stories: [] };
      }

      return {
        hasActiveStory: data && data.length > 0,
        stories: data || [],
      };
    },
    enabled: !!userId,
    staleTime: 30000, // 30 segundos
  });

  return {
    hasActiveStory: query.data?.hasActiveStory ?? false,
    stories: query.data?.stories ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
