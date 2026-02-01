import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, Route, Flame } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

interface LevelDetailOverlayProps {
  open: boolean;
  onClose: () => void;
}

type UserLevel = Database['public']['Tables']['user_levels']['Row'];

export const LevelDetailOverlay = ({ open, onClose }: LevelDetailOverlayProps) => {
  const { data: profile } = useProfile();
  const { data: stats } = useProfileStats();

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

  if (!open) return null;

  const currentLevel = profile?.level || 1;
  const currentLevelData = levels?.find((l) => l.level === currentLevel);
  const nextLevelData = levels?.find((l) => l.level === currentLevel + 1);
  const totalKm = stats?.totalKm || 0;
  const kmToNextLevel = nextLevelData ? nextLevelData.km_required - totalKm : 0;
  const progressPercentage = nextLevelData
    ? Math.max(0, Math.min(100, ((totalKm - currentLevelData?.km_required || 0) / (nextLevelData.km_required - (currentLevelData?.km_required || 0))) * 100))
    : 100;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background"
        >
          {/* Header */}
          <header className="sticky top-0 z-40 glass border-b border-border/30">
            <div className="flex items-center justify-between px-4 h-14">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <h1 className="font-semibold text-lg">Nível {profile?.level || 1}</h1>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-full hover:bg-secondary"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </header>

          {/* Content */}
          <div className="p-4 pb-20 space-y-6">
            {/* Level Info */}
            <div className="text-center space-y-2">
              <div className="text-6xl font-bold text-primary">
                {profile?.level || 1}
              </div>
              <p className="text-muted-foreground">
                Seu nível atual
              </p>
            </div>

            {/* Progress Metrics */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Suas métricas</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-card rounded-xl border border-border/50 text-center">
                  <Route className="w-5 h-5 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold">{stats?.totalKm.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground">Km rodados</p>
                </div>
                <div className="p-4 bg-card rounded-xl border border-border/50 text-center">
                  <Flame className="w-5 h-5 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold">{stats?.ridesCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Rolês</p>
                </div>
                <div className="p-4 bg-card rounded-xl border border-border/50 text-center">
                  <Award className="w-5 h-5 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold">{stats?.badgesCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Conquistas</p>
                </div>
                <div className="p-4 bg-card rounded-xl border border-border/50 text-center">
                  <Route className="w-5 h-5 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold">{stats?.totalHours || 0}</p>
                  <p className="text-xs text-muted-foreground">Horas</p>
                </div>
              </div>
            </div>

            {/* Progresso para próximo nível */}
            {nextLevelData && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Progresso para próximo nível</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Nível {currentLevel} → Nível {nextLevelData.level}
                    </span>
                    <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    {kmToNextLevel > 0
                      ? `Faltam ${kmToNextLevel.toFixed(1)} km para o nível ${nextLevelData.level}`
                      : `Você atingiu o nível máximo!`}
                  </p>
                </div>
              </div>
            )}

            {/* Info sobre níveis */}
            {levels && levels.length > 0 && (
              <div className="p-4 bg-primary/10 rounded-xl border border-primary/30">
                <p className="text-sm text-muted-foreground text-center mb-2">
                  Continue registrando seus rolês para aumentar seu nível!
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  {levels.slice(0, 5).map((level) => (
                    <div key={level.level} className="flex justify-between">
                      <span>Nível {level.level}:</span>
                      <span className="font-medium">{level.km_required} km</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
