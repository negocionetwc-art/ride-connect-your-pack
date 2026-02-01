import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, RefreshCw, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Database } from '@/integrations/supabase/types';
import { useProfile } from '@/hooks/useProfile';

type LeaderboardEntry = Database['public']['Tables']['leaderboard_cache']['Row'];

interface LeaderboardProps {
  open: boolean;
  onClose: () => void;
}

export const Leaderboard = ({ open, onClose }: LeaderboardProps) => {
  const [filter, setFilter] = useState<'all' | 'month' | 'week'>('all');
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  // Buscar ranking
  const { data: leaderboard, isLoading, refetch } = useQuery({
    queryKey: ['leaderboard', filter],
    queryFn: async () => {
      // Atualizar cache do ranking antes de buscar
      const { error: refreshError } = await supabase.rpc('refresh_leaderboard');
      if (refreshError) {
        console.error('Erro ao atualizar ranking:', refreshError);
      }

      let query = supabase
        .from('leaderboard_cache')
        .select('*')
        .order('rank_position', { ascending: true })
        .limit(100);

      // Aplicar filtros temporais (implementação futura)
      // Por enquanto, sempre retorna todos

      const { data, error } = await query;

      if (error) throw error;
      return data as LeaderboardEntry[];
    },
    enabled: open,
  });

  // Buscar posição do usuário atual
  const userPosition = leaderboard?.findIndex((entry) => entry.user_id === profile?.id) ?? -1;
  const userEntry = userPosition >= 0 ? leaderboard?.[userPosition] : null;

  const getRankIcon = (position: number) => {
    if (position === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (position === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (position === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return null;
  };

  const getRankColor = (position: number) => {
    if (position === 1) return 'bg-yellow-500/10 border-yellow-500/30';
    if (position === 2) return 'bg-gray-400/10 border-gray-400/30';
    if (position === 3) return 'bg-amber-600/10 border-amber-600/30';
    return 'bg-card border-border/50';
  };

  if (!open) return null;

  return (
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
            <Trophy className="w-5 h-5 text-primary" />
            <h1 className="font-semibold text-lg">Ranking Global</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 px-4 pb-3">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="flex-1"
          >
            Todos
          </Button>
          <Button
            variant={filter === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('month')}
            className="flex-1"
            disabled
          >
            Este mês
          </Button>
          <Button
            variant={filter === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('week')}
            className="flex-1"
            disabled
          >
            Esta semana
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 pb-20 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Carregando ranking...</div>
          </div>
        ) : leaderboard && leaderboard.length > 0 ? (
          <>
            {/* Top 3 destacados */}
            {leaderboard.slice(0, 3).length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {leaderboard.slice(0, 3).map((entry, index) => {
                  const position = index + 1;
                  return (
                    <motion.div
                      key={entry.user_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl border text-center ${getRankColor(position)}`}
                    >
                      {getRankIcon(position)}
                      <Avatar className="w-12 h-12 mx-auto my-2">
                        <AvatarImage src={entry.avatar_url || undefined} />
                        <AvatarFallback>
                          {entry.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium truncate">{entry.username}</p>
                      <p className="text-xs text-muted-foreground">Nível {entry.level}</p>
                      <p className="text-lg font-bold text-primary mt-1">
                        {entry.total_km.toLocaleString()} km
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Lista completa */}
            <div className="space-y-2">
              {leaderboard.map((entry, index) => {
                const position = index + 1;
                const isCurrentUser = entry.user_id === profile?.id;

                return (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`p-4 rounded-xl border flex items-center gap-4 ${
                      isCurrentUser
                        ? 'bg-primary/10 border-primary/30'
                        : getRankColor(position)
                    }`}
                  >
                    {/* Posição */}
                    <div className="flex-shrink-0 w-10 text-center">
                      {getRankIcon(position) || (
                        <span className="text-sm font-semibold text-muted-foreground">
                          #{position}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={entry.avatar_url || undefined} />
                      <AvatarFallback>
                        {entry.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{entry.username}</p>
                        {isCurrentUser && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            Você
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>Nível {entry.level}</span>
                        <span>•</span>
                        <span>{entry.total_rides} rolês</span>
                      </div>
                    </div>

                    {/* KM */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        {entry.total_km.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">km</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Posição do usuário se não estiver no top 100 */}
            {userPosition < 0 && userEntry && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-xl border bg-primary/10 border-primary/30"
              >
                <p className="text-sm text-muted-foreground mb-2">Sua posição</p>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-primary">
                      #{userEntry.rank_position || '?'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{userEntry.username}</p>
                    <p className="text-xs text-muted-foreground">
                      Nível {userEntry.level} • {userEntry.total_km.toLocaleString()} km
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum ranking disponível ainda</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
