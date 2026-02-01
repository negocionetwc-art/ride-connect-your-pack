import { useEffect, useRef } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import { useProfileBadges } from '@/hooks/useProfileBadges';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserLevel = Database['public']['Tables']['user_levels']['Row'];

interface MotivationalMessage {
  message: string;
  type: 'proximity' | 'achievement' | 'motivation' | 'competition';
}

export function useMotivationalMessages(
  currentDistance: number,
  isTracking: boolean
) {
  const { data: profile } = useProfile();
  const { data: stats } = useProfileStats();
  const { data: badges } = useProfileBadges();
  const lastMessageTimeRef = useRef<number>(0);
  const lastDistanceMilestoneRef = useRef<number>(0);
  const MESSAGE_COOLDOWN = 5 * 60 * 1000; // 5 minutos

  // Buscar níveis do sistema
  const { data: levels } = useQuery({
    queryKey: ['user-levels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_levels')
        .select('*')
        .order('level', { ascending: true });

      if (error) throw error;
      return data as UserLevel[];
    },
  });

  useEffect(() => {
    if (!isTracking || !profile || !stats || !levels) return;

    const now = Date.now();
    const totalKm = stats.totalKm + currentDistance;
    const currentLevel = profile.level || 1;

    // Verificar marcos de distância (a cada 5km durante o rolê)
    const distanceMilestone = Math.floor(currentDistance / 5) * 5;
    if (
      distanceMilestone > lastDistanceMilestoneRef.current &&
      distanceMilestone >= 5 &&
      now - lastMessageTimeRef.current > MESSAGE_COOLDOWN
    ) {
      lastDistanceMilestoneRef.current = distanceMilestone;
      lastMessageTimeRef.current = now;

      toast({
        title: '🎉 Marco alcançado!',
        description: `Você já rodou ${distanceMilestone} km neste rolê!`,
      });
      return;
    }

    // Verificar proximidade de próximo nível
    const nextLevel = levels.find((l) => l.level > currentLevel);
    if (nextLevel) {
      const kmToNextLevel = nextLevel.km_required - totalKm;

      if (kmToNextLevel > 0 && kmToNextLevel <= 5 && now - lastMessageTimeRef.current > MESSAGE_COOLDOWN) {
        lastMessageTimeRef.current = now;

        toast({
          title: '🔥 Quase lá!',
          description: `Faltam apenas ${kmToNextLevel.toFixed(1)} km para o nível ${nextLevel.level}!`,
        });
        return;
      }
    }

    // Verificar proximidade de badges
    if (badges) {
      for (const badge of badges) {
        if (badge.unlocked || !badge.progress) continue;

        const remaining = badge.progress.targetValue - badge.progress.currentValue;
        const currentProgress = badge.progress.currentValue + 
          (badge.requirement_type === 'km' ? currentDistance : 0);

        if (remaining > 0 && remaining <= 2 && currentProgress < badge.progress.targetValue) {
          if (now - lastMessageTimeRef.current > MESSAGE_COOLDOWN) {
            lastMessageTimeRef.current = now;

            toast({
              title: '⭐ Quase desbloqueado!',
              description: `Faltam apenas ${remaining.toFixed(1)} ${badge.requirement_type === 'km' ? 'km' : ''} para desbloquear "${badge.name}"!`,
            });
            return;
          }
        }
      }
    }
  }, [currentDistance, isTracking, profile, stats, badges, levels]);
}
