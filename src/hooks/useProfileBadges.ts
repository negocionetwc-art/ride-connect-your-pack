import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Badge = Database['public']['Tables']['badges']['Row'];
type UserBadge = Database['public']['Tables']['user_badges']['Row'];

export interface BadgeWithUnlocked extends Badge {
  unlocked: boolean;
  unlockedAt?: string;
}

export function useProfileBadges() {
  return useQuery({
    queryKey: ['profile-badges'],
    queryFn: async (): Promise<BadgeWithUnlocked[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return [];
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
        .eq('user_id', user.id);

      if (userBadgesError) throw userBadgesError;

      const unlockedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);
      const unlockedAtMap = new Map(
        userBadges?.map(ub => [ub.badge_id, ub.unlocked_at]) || []
      );

      return (badges || []).map(badge => ({
        ...badge,
        unlocked: unlockedBadgeIds.has(badge.id),
        unlockedAt: unlockedAtMap.get(badge.id),
      }));
    },
  });
}
