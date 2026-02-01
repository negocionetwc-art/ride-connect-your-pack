import { motion, AnimatePresence } from 'framer-motion';
import { X, Route, Search, Clock, MapPin, Camera } from 'lucide-react';
import { useRides } from '@/hooks/useRides';
import { useState } from 'react';
import type { Database } from '@/integrations/supabase/types';
import { useProfileStats } from '@/hooks/useProfileStats';

type Ride = Database['public']['Tables']['rides']['Row'];

interface RidesOverlayProps {
  open: boolean;
  onClose: () => void;
}

export const RidesOverlay = ({ open, onClose }: RidesOverlayProps) => {
  const { data: rides, isLoading } = useRides();
  const { data: stats } = useProfileStats();
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'month' | 'year'>('all');

  const filteredRides = rides?.filter((ride) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        ride.start_location?.toLowerCase().includes(query) ||
        ride.end_location?.toLowerCase().includes(query) ||
        ride.description?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    if (filter === 'month') {
      const rideDate = new Date(ride.end_time || ride.created_at);
      const now = new Date();
      return (
        rideDate.getMonth() === now.getMonth() &&
        rideDate.getFullYear() === now.getFullYear()
      );
    }

    if (filter === 'year') {
      const rideDate = new Date(ride.end_time || ride.created_at);
      const now = new Date();
      return rideDate.getFullYear() === now.getFullYear();
    }

    return true;
  });

  if (!open) return null;

  return (
    <>
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
                  <Route className="w-5 h-5 text-primary" />
                  <h1 className="font-semibold text-lg">Meus Rolês</h1>
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

            {/* Estatísticas */}
            {stats && (
              <div className="px-4 py-3 border-b border-border/30">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{rides?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Total de rolês</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {stats.totalKm.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Km total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{stats.totalHours}</p>
                    <p className="text-xs text-muted-foreground">Horas</p>
                  </div>
                </div>
              </div>
            )}

            {/* Filtros e busca */}
            <div className="px-4 py-3 border-b border-border/30 space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border text-muted-foreground'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilter('month')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'month'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border text-muted-foreground'
                  }`}
                >
                  Este mês
                </button>
                <button
                  onClick={() => setFilter('year')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'year'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border text-muted-foreground'
                  }`}
                >
                  Este ano
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por localização..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-card border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-4 pb-20 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">Carregando...</div>
                </div>
              ) : filteredRides && filteredRides.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {filteredRides.map((ride) => {
                    const photos = (ride.photos as string[]) || [];
                    const formatTime = (minutes: number) => {
                      const hours = Math.floor(minutes / 60);
                      const mins = minutes % 60;
                      if (hours > 0) return `${hours}h ${mins}min`;
                      return `${mins}min`;
                    };

                    return (
                      <motion.button
                        key={ride.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => setSelectedRide(ride)}
                        className="p-4 bg-card rounded-xl border border-border/50 text-left space-y-3 hover:border-primary/50 transition-colors"
                      >
                        {/* Header com data */}
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {new Date(ride.end_time || ride.created_at).toLocaleDateString('pt-BR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                          {ride.distance_km && (
                            <span className="text-lg font-bold text-primary">
                              {ride.distance_km.toFixed(2)} km
                            </span>
                          )}
                        </div>

                        {/* Métricas */}
                        <div className="grid grid-cols-3 gap-3">
                          {ride.duration_minutes && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>{formatTime(ride.duration_minutes)}</span>
                            </div>
                          )}
                          {ride.start_location && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate">{ride.start_location}</span>
                            </div>
                          )}
                          {photos.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Camera className="w-4 h-4" />
                              <span>{photos.length} foto{photos.length > 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>

                        {/* Descrição */}
                        {ride.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {ride.description}
                          </p>
                        )}

                        {/* Fotos preview */}
                        {photos.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto">
                            {photos.slice(0, 3).map((photo, index) => (
                              <img
                                key={index}
                                src={photo}
                                alt={`Foto ${index + 1}`}
                                className="w-16 h-16 rounded-lg object-cover border border-border"
                              />
                            ))}
                            {photos.length > 3 && (
                              <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center border border-border">
                                <span className="text-xs text-muted-foreground">
                                  +{photos.length - 3}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Route className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery || filter !== 'all'
                      ? 'Nenhum rolê encontrado'
                      : 'Você ainda não registrou nenhum rolê'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedRide && (
        <div className="fixed inset-0 z-50 bg-background p-4 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-4">
            <button
              onClick={() => setSelectedRide(null)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
              Voltar
            </button>
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h2 className="text-2xl font-bold">
                {new Date(selectedRide.end_time || selectedRide.created_at).toLocaleDateString('pt-BR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Distância</p>
                  <p className="text-xl font-bold text-primary">
                    {selectedRide.distance_km?.toFixed(2) || 0} km
                  </p>
                </div>
                {selectedRide.duration_minutes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Duração</p>
                    <p className="text-xl font-bold">
                      {Math.floor(selectedRide.duration_minutes / 60)}h{' '}
                      {selectedRide.duration_minutes % 60}min
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Fotos</p>
                  <p className="text-xl font-bold">
                    {((selectedRide.photos as string[]) || []).length}
                  </p>
                </div>
              </div>
              {selectedRide.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Descrição</p>
                  <p className="text-sm">{selectedRide.description}</p>
                </div>
              )}
              {((selectedRide.photos as string[]) || []).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Fotos</p>
                  <div className="grid grid-cols-3 gap-2">
                    {((selectedRide.photos as string[]) || []).map((photo, index) => (
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
            </div>
          </div>
        </div>
      )}
    </>
  );
};
