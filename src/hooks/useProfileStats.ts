import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProfileStats {
  totalKm: number;
  ridesCount: number;
  totalHours: number;
  badgesCount: number;
}

export function useProfileStats() {
  return useQuery({
    queryKey: ['profile-stats'],
    queryFn: async (): Promise<ProfileStats> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { totalKm: 0, ridesCount: 0, totalHours: 0, badgesCount: 0 };
      }

      // Buscar perfil para total_km
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_km')
        .eq('id', user.id)
        .single();

      // Contar posts (rolês)
      const { count: ridesCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Somar duration_minutes de todos os posts
      const { data: posts } = await supabase
        .from('posts')
        .select('duration_minutes')
        .eq('user_id', user.id);

      const totalMinutes = posts?.reduce((sum, post) => sum + (post.duration_minutes || 0), 0) || 0;
      const totalHours = Math.round(totalMinutes / 60);

      // Contar badges
      const { count: badgesCount } = await supabase
        .from('user_badges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      return {
        totalKm: profile?.total_km || 0,
        ridesCount: ridesCount || 0,
        totalHours,
        badgesCount: badgesCount || 0,
      };
    },
  });
}
