import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Post = Database['public']['Tables']['posts']['Row'];

export function useProfilePosts(limit?: number, userId?: string | null) {
  return useQuery({
    queryKey: ['profile-posts', limit, userId],
    queryFn: async (): Promise<Post[]> => {
      let targetUserId = userId;
      
      // Se não foi passado userId, buscar do usuário logado
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return [];
        }
        targetUserId = user.id;
      }

      let query = supabase
        .from('posts')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });
}
