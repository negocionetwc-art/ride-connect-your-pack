import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FollowStatus {
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
}

export function useFollowStatus(userId?: string | null) {
  return useQuery({
    queryKey: ['follow-status', userId],
    queryFn: async (): Promise<FollowStatus | null> => {
      if (!userId) {
        return null;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          isFollowing: false,
          followersCount: 0,
          followingCount: 0,
        };
      }

      // Verificar se está seguindo usando a função SQL
      const { data: isFollowingData, error: isFollowingError } = await supabase
        .rpc('is_following', { _profile_id: userId });

      const isFollowing = isFollowingError ? false : (isFollowingData ?? false);

      // Contar seguidores (quem segue este usuário)
      const { count: followersCount, error: followersError } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      // Contar seguindo (quem este usuário segue)
      const { count: followingCount, error: followingError } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      if (followersError || followingError) {
        console.error('Erro ao buscar contadores de follow:', followersError || followingError);
      }

      return {
        isFollowing,
        followersCount: followersCount ?? 0,
        followingCount: followingCount ?? 0,
      };
    },
    enabled: !!userId,
  });
}
