import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, MapPin, Clock, Route, Users, Camera, Trophy, Award, Zap, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useProfile } from '@/hooks/useProfile';
import type { Database } from '@/integrations/supabase/types';

type Ride = Database['public']['Tables']['rides']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface RideCompleteProps {
  rideId: string;
  onClose: () => void;
}

export const RideComplete = ({ rideId, onClose }: RideCompleteProps) => {
  const [description, setDescription] = useState('');
  const [taggedUsers, setTaggedUsers] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [levelUp, setLevelUp] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const { data: profile } = useProfile();

  // Buscar dados do rolê
  const { data: ride, isLoading } = useQuery({
    queryKey: ['ride', rideId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('id', rideId)
        .single();

      if (error) throw error;
      return data as Ride;
    },
  });

  // Buscar perfil atualizado para verificar level up
  const { data: updatedProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!ride && ride.status === 'completed',
  });

  // Verificar level up
  useEffect(() => {
    if (updatedProfile && profile && updatedProfile.level > profile.level) {
      setLevelUp(true);
    }
  }, [updatedProfile, profile]);

  // Buscar badges desbloqueados recentemente
  useEffect(() => {
    const checkNewBadges = async () => {
      if (!ride || ride.status !== 'completed') return;

      const { data: badges } = await supabase
        .from('user_badges')
        .select('badge_id, unlocked_at, badges(name)')
        .eq('user_id', ride.user_id)
        .gte('unlocked_at', ride.end_time || ride.created_at)
        .order('unlocked_at', { ascending: false });

      if (badges && badges.length > 0) {
        setNewBadges(badges.map((b: any) => b.badges?.name || ''));
      }
    };

    checkNewBadges();
  }, [ride]);

  // Salvar descrição e pessoas marcadas
  const handleSave = async () => {
    if (!ride) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('rides')
        .update({
          description: description || null,
          tagged_users: taggedUsers,
        })
        .eq('id', rideId);

      if (error) throw error;

      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Formatar tempo
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  // Formatar distância
  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(2)} km`;
  };

  if (isLoading || !ride) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const photos = (ride.photos as string[]) || [];
  const routePoints = (ride.route_points as any[]) || [];

  return (
    <div className="min-h-screen pb-20 bg-background">
      <AnimatePresence>
        {/* Animação de Level Up */}
        {levelUp && updatedProfile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setLevelUp(false)}
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="bg-card rounded-2xl p-8 max-w-sm mx-4 text-center border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <Trophy className="w-16 h-16 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Parabéns! 🎉</h2>
              <p className="text-muted-foreground mb-4">
                Você subiu para o nível <span className="font-bold text-primary">{updatedProfile.level}</span>
              </p>
              <p className="text-sm text-muted-foreground">{updatedProfile.level_title}</p>
              <Button onClick={() => setLevelUp(false)} className="mt-4 w-full">
                Continuar
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* Animação de Badge Desbloqueado */}
        {newBadges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setNewBadges([])}
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="bg-card rounded-2xl p-8 max-w-sm mx-4 text-center border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <Award className="w-16 h-16 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Conquista Desbloqueada! 🏆</h2>
              <p className="text-muted-foreground mb-4">
                {newBadges.map((badge, i) => (
                  <span key={i} className="block font-semibold text-primary">{badge}</span>
                ))}
              </p>
              <Button onClick={() => setNewBadges([])} className="mt-4 w-full">
                Continuar
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/30">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="font-semibold text-lg">Rolê Finalizado</h1>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Resumo do Rolê */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20 text-center"
        >
          <CheckCircle className="w-12 h-12 mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold mb-2">Rolê Concluído!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            {new Date(ride.end_time || ride.created_at).toLocaleDateString('pt-BR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Route className="w-6 h-6 mx-auto text-primary mb-2" />
              <p className="text-xl font-bold">{formatDistance(ride.distance_km || 0)}</p>
              <p className="text-xs text-muted-foreground">Distância</p>
            </div>
            <div>
              <Clock className="w-6 h-6 mx-auto text-primary mb-2" />
              <p className="text-xl font-bold">
                {ride.duration_minutes ? formatTime(ride.duration_minutes) : '0min'}
              </p>
              <p className="text-xs text-muted-foreground">Duração</p>
            </div>
            <div>
              <Zap className="w-6 h-6 mx-auto text-primary mb-2" />
              <p className="text-xl font-bold">
                {routePoints.length > 0
                  ? Math.round(
                      routePoints.reduce((sum: number, p: any) => sum + (p.speed || 0), 0) /
                        routePoints.length
                    )
                  : 0}
              </p>
              <p className="text-xs text-muted-foreground">km/h médio</p>
            </div>
          </div>
        </motion.div>

        {/* Localizações */}
        {(ride.start_location || ride.end_location) && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Localizações</h3>
            {ride.start_location && (
              <div className="p-4 bg-card rounded-xl border border-border/50 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Início</p>
                  <p className="text-sm">{ride.start_location}</p>
                </div>
              </div>
            )}
            {ride.end_location && (
              <div className="p-4 bg-card rounded-xl border border-border/50 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Fim</p>
                  <p className="text-sm">{ride.end_location}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fotos */}
        {photos.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-sm">Fotos ({photos.length})</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Foto ${index + 1}`}
                  className="w-full aspect-square rounded-lg object-cover border border-border"
                />
              ))}
            </div>
          </div>
        )}

        {/* Descrição */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Adicionar descrição (opcional)</h3>
          <Textarea
            placeholder="Conte sobre seu rolê..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Marcar pessoas */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-sm">Marcar pessoas (opcional)</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Funcionalidade de marcar pessoas será implementada em breve
          </p>
        </div>

        {/* Botão salvar */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
          size="lg"
        >
          {isSaving ? 'Salvando...' : 'Salvar e Compartilhar'}
        </Button>
      </div>
    </div>
  );
};
