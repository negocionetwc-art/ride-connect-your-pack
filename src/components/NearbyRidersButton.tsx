import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { users } from '@/data/mockData';

type UserLocation = Database['public']['Tables']['user_locations']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface RiderInfo {
  id: string;
  name: string;
  avatar: string;
  bike?: string;
  speed?: number;
  level?: number;
  totalKm?: number;
  location?: { lat: number; lng: number };
}

interface NearbyRidersButtonProps {
  onRiderSelect?: (rider: RiderInfo) => void;
}

export const NearbyRidersButton = ({ onRiderSelect }: NearbyRidersButtonProps) => {
  const [showNearbyRiders, setShowNearbyRiders] = useState(false);
  const [buttonPositionPercent, setButtonPositionPercent] = useState<{ x: number; y: number } | null>(null);
  const [buttonPixelPos, setButtonPixelPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [onlineLocations, setOnlineLocations] = useState<UserLocation[]>([]);
  const [onlineRidersProfiles, setOnlineRidersProfiles] = useState<Map<string, Profile>>(new Map());

  const onlineRiders = users.filter(u => u.isOnline);

  // Carregar localizações online do banco de dados
  useEffect(() => {
    const loadOnlineLocations = async () => {
      try {
        const { data: locationsData, error: locationsError } = await supabase
          .from('user_locations')
          .select('*')
          .eq('is_online', true);

        if (locationsError) {
          console.error('Erro ao buscar localizações:', locationsError);
        } else if (locationsData) {
          setOnlineLocations(locationsData);

          // Buscar perfis dos usuários online
          const userIds = locationsData.map(loc => loc.user_id);
          if (userIds.length > 0) {
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('*')
              .in('id', userIds);

            if (profilesError) {
              console.error('Erro ao buscar perfis:', profilesError);
            } else if (profilesData) {
              const profilesMap = new Map();
              profilesData.forEach(profile => {
                profilesMap.set(profile.id, profile);
              });
              setOnlineRidersProfiles(profilesMap);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar localizações:', error);
      }
    };

    loadOnlineLocations();

    // Atualizar a cada 10 segundos
    const interval = setInterval(loadOnlineLocations, 10000);
    return () => clearInterval(interval);
  }, []);

  // Converter percentual → px APENAS UMA VEZ (igual StoryDraggableText)
  useLayoutEffect(() => {
    if (!containerRef.current || !buttonRef.current) return;

    const c = containerRef.current.getBoundingClientRect();
    const b = buttonRef.current.getBoundingClientRect();

    if (buttonPositionPercent) {
      setButtonPixelPos({
        x: buttonPositionPercent.x * c.width - b.width / 2,
        y: buttonPositionPercent.y * c.height - b.height / 2,
      });
    } else {
      // Posição padrão: left 16px, bottom 8rem (convertido para percentual)
      const defaultX = 16 / c.width;
      const defaultY = (c.height - 128) / c.height; // 8rem = 128px
      setButtonPixelPos({
        x: defaultX * c.width - b.width / 2,
        y: defaultY * c.height - b.height / 2,
      });
    }
  }, [buttonPositionPercent]);

  // Combinar todos os pilotos (mock + banco)
  const allRiders = [
    ...onlineRiders.map(rider => ({
      id: rider.id,
      avatar: rider.avatar,
      name: rider.name,
    })),
    ...onlineLocations.map(location => {
      const profile = onlineRidersProfiles.get(location.user_id);
      return profile ? {
        id: location.user_id,
        avatar: profile.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
        name: profile.name,
      } : null;
    }).filter(Boolean) as Array<{ id: string; avatar: string; name: string }>,
  ];

  const totalRiders = allRiders.length;
  const displayRiders = allRiders.slice(0, 3);
  const remainingCount = totalRiders > 3 ? totalRiders - 3 : 0;

  const handleRiderClick = (rider: RiderInfo) => {
    setShowNearbyRiders(false);
    onRiderSelect?.(rider);
  };

  return (
    <>
      <div ref={containerRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 999 }} />
      <AnimatePresence>
        <motion.div
          ref={buttonRef}
          drag
          dragMomentum={false}
          dragElastic={0.15}
          style={{
            position: 'fixed',
            x: buttonPixelPos.x,
            y: buttonPixelPos.y,
            zIndex: showNearbyRiders ? 1001 : 1000,
            pointerEvents: 'auto',
          }}
          onDragEnd={(_, info) => {
            if (!containerRef.current || !buttonRef.current) return;

            const c = containerRef.current.getBoundingClientRect();
            const b = buttonRef.current.getBoundingClientRect();

            const newX = info.point.x - c.left - b.width / 2;
            const newY = info.point.y - c.top - b.height / 2;

            setButtonPixelPos({ x: newX, y: newY });

            // Salvar em percentual
            setButtonPositionPercent({
              x: Math.min(Math.max((newX + b.width / 2) / c.width, 0), 1),
              y: Math.min(Math.max((newY + b.height / 2) / c.height, 0), 1),
            });
          }}
          className="absolute cursor-move select-none touch-none"
        >
          {!showNearbyRiders ? (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowNearbyRiders(true)}
              className="p-2 bg-card rounded-full shadow-xl border border-border flex items-center justify-center"
            >
              {totalRiders === 0 ? (
                <Navigation className="w-5 h-5 text-muted-foreground" />
              ) : (
                <div className="flex items-center -space-x-2">
                  {displayRiders.map((rider, index) => (
                    <div
                      key={rider.id}
                      className="relative"
                      style={{ zIndex: 3 - index }}
                    >
                      <img
                        src={rider.avatar}
                        alt={rider.name}
                        className="w-8 h-8 rounded-full border-2 border-card ring-2 ring-green-500 object-cover"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
                    </div>
                  ))}
                  {remainingCount > 0 && (
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-secondary border-2 border-card ring-2 ring-green-500 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-primary">+{remainingCount}</span>
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
                    </div>
                  )}
                </div>
              )}
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                position: 'fixed',
                bottom: '80px', // Acima da barra de navegação (64px + 16px de margem)
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
              }}
              className="bg-card rounded-2xl border border-border p-4 shadow-xl min-w-[300px] max-w-[90vw]"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-primary" />
                  Pilotos Próximos
                </h3>
                <button
                  onClick={() => setShowNearbyRiders(false)}
                  className="p-1 rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {/* Riders do mock data */}
                {onlineRiders.map((rider) => (
                  <button
                    key={rider.id}
                    onClick={() => handleRiderClick({
                      id: rider.id,
                      name: rider.name,
                      avatar: rider.avatar,
                      bike: rider.bike,
                      speed: rider.speed,
                      level: rider.level,
                      totalKm: rider.totalKm,
                      location: rider.location,
                    })}
                    className="flex-shrink-0 flex items-center gap-2 p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <img src={rider.avatar} alt={rider.name} className="w-8 h-8 rounded-full object-cover" />
                    <div className="text-left">
                      <p className="text-xs font-medium">{rider.name.split(' ')[0]}</p>
                      <p className="text-[10px] text-primary">{rider.speed} km/h</p>
                    </div>
                  </button>
                ))}
                
                {/* Riders do banco de dados */}
                {onlineLocations.map((location) => {
                  const profile = onlineRidersProfiles.get(location.user_id);
                  if (!profile) return null;
                  
                  return (
                    <button
                      key={location.id}
                      onClick={() => handleRiderClick({
                        id: location.user_id,
                        name: profile.name,
                        avatar: profile.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
                        bike: profile.bike || undefined,
                        speed: location.speed_kmh ? Math.round(location.speed_kmh) : undefined,
                        level: profile.level,
                        totalKm: profile.total_km,
                        location: {
                          lat: location.latitude,
                          lng: location.longitude,
                        },
                      })}
                      className="flex-shrink-0 flex items-center gap-2 p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <img
                        src={profile.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'}
                        alt={profile.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="text-left">
                        <p className="text-xs font-medium">{profile.name.split(' ')[0]}</p>
                        {location.speed_kmh && (
                          <p className="text-[10px] text-primary">{Math.round(location.speed_kmh)} km/h</p>
                        )}
                      </div>
                    </button>
                  );
                })}
                
                {/* Mensagem quando não há pilotos */}
                {(onlineRiders.length === 0 && onlineLocations.length === 0) && (
                  <div className="flex items-center justify-center w-full py-4 text-muted-foreground text-sm">
                    <p>Nenhum piloto próximo no momento</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
};
