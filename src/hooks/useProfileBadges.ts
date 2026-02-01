import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Badge = Database['public']['Tables']['badges']['Row'];
type UserBadge = Database['public']['Tables']['user_badges']['Row'];

export interface BadgeWithUnlocked extends Badge {
  unlocked: boolean;
  unlockedAt?: string;
  progress?: {
    currentValue: number;
    targetValue: number;
    percentage: number;
  };
}

export function useProfileBadges(userId?: string | null) {
  return useQuery({
    queryKey: ['profile-badges', userId],
    queryFn: async (): Promise<BadgeWithUnlocked[]> => {
      let targetUserId = userId;
      
      // Se não foi passado userId, buscar do usuário logado
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return [];
        }
        targetUserId = user.id;
      }

      // Buscar todos os badges
      const { data: badges, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .order('created_at', { ascending: true });

      if (badgesError) throw badgesError;

      // Buscar badges desbloqueados pelo usuário
      const { data: userBadges, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('badge_id, unlocked_at')
        .eq('user_id', targetUserId);

      if (userBadgesError) throw userBadgesError;

      // Buscar progresso de badges
      const { data: badgeProgress, error: progressError } = await supabase
        .from('badge_progress')
        .select('badge_id, current_value, target_value, percentage, unlocked')
        .eq('user_id', targetUserId);

      if (progressError) throw progressError;

      const unlockedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);
      const unlockedAtMap = new Map(
        userBadges?.map(ub => [ub.badge_id, ub.unlocked_at]) || []
      );
      const progressMap = new Map(
        badgeProgress?.map(bp => [
          bp.badge_id,
          {
            currentValue: bp.current_value,
            targetValue: bp.target_value,
            percentage: bp.percentage,
          },
        ]) || []
      );

      return (badges || []).map(badge => ({
        ...badge,
        unlocked: unlockedBadgeIds.has(badge.id),
        unlockedAt: unlockedAtMap.get(badge.id),
        progress: progressMap.get(badge.id),
      }));
    },
  });
}
