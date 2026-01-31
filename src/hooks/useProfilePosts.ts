import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Post = Database['public']['Tables']['posts']['Row'];

export function useProfilePosts(limit?: number) {
  return useQuery({
    queryKey: ['profile-posts', limit],
    queryFn: async (): Promise<Post[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

      let query = supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
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
