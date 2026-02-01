import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, Radio, ChevronUp, X, MapPin, Loader2, UserPlus, UserCheck } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import type * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { users, groups } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { createGroupMarkerIcon, createRiderMarkerIcon, createOwnLocationMarkerIcon } from './MapMarker';
import { LocationDetailSheet } from './LocationDetailSheet';
import { useLocationSharing } from '@/hooks/useLocationSharing';
import { Switch } from '@/components/ui/switch';
import { useQuery } from '@tanstack/react-query';
import { useFollow } from '@/hooks/useFollow';
import { useFollowStatus } from '@/hooks/useFollowStatus';

type Group = Database['public']['Tables']['groups']['Row'];
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

const onlineRiders = users.filter(u => u.isOnline);

// Configurar ícone padrão do Leaflet (necessário para React-Leaflet)
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Componente para centralizar o mapa na localização do usuário
function MapCenter({ center }: { center: LatLngExpression }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [map, center]);
  return null;
}

// Componente para o marcador do próprio usuário que atualiza em tempo real
function OwnLocationMarker({ 
  location, 
  avatarUrl, 
  speed 
}: { 
  location: { latitude: number; longitude: number }; 
  avatarUrl?: string; 
  speed?: number;
}) {
  const markerRef = useRef<L.Marker | null>(null);
  
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([location.latitude, location.longitude]);
    }
  }, [location.latitude, location.longitude]);

  return (
    <Marker
      ref={markerRef}
      position={[location.latitude, location.longitude]}
      icon={createOwnLocationMarkerIcon(avatarUrl, speed)}
    >
      <Popup>
        <div className="text-center">
          <h3 className="font-semibold text-green-600 dark:text-green-400">Você</h3>
          <p className="text-xs text-muted-foreground">Compartilhando localização</p>
          {speed !== undefined && (
            <p className="text-xs text-primary font-medium">
              {Math.round(speed)} km/h
            </p>
          )}
        </div>
      </Popup>
    </Marker>
  );
}


interface LiveMapProps {
  onRiderSelectChange?: (isOpen: boolean) => void;
}

export const LiveMap = ({ onRiderSelectChange }: LiveMapProps) => {
  const [selectedRider, setSelectedRider] = useState<RiderInfo | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showNearbyRiders, setShowNearbyRiders] = useState(false);
  const [buttonPosition, setButtonPosition] = useState<{ x: number; y: number } | null>(null); // Posição do botão (null = usar padrão)
  const [userLocation, setUserLocation] = useState<LatLngExpression>([-23.5505, -46.6333]); // São Paulo padrão
  const [groupsWithLocation, setGroupsWithLocation] = useState<Group[]>([]);
  const [onlineLocations, setOnlineLocations] = useState<UserLocation[]>([]);
  const [onlineRidersProfiles, setOnlineRidersProfiles] = useState<Map<string, Profile>>(new Map());

  // Hook de compartilhamento de localização
  const {
    isSharing,
    currentLocation,
    error: locationError,
    isLoading: locationLoading,
    toggleSharing,
  } = useLocationSharing();

  // Buscar perfil do usuário atual para avatar
  const { data: currentUserProfile } = useQuery({
    queryKey: ['current-user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      return data;
    },
  });

  // Hook para seguir/deseguir
  const followMutation = useFollow();
  const { data: followStatus } = useFollowStatus(selectedRider?.id);
  
  // Verificar se o rider selecionado é o próprio usuário
  const [isOwnRider, setIsOwnRider] = useState(false);
  
  useEffect(() => {
    const checkOwnRider = async () => {
      if (!selectedRider) {
        setIsOwnRider(false);
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user && selectedRider.id === user.id) {
        setIsOwnRider(true);
      } else {
        setIsOwnRider(false);
      }
    };
    
    checkOwnRider();
  }, [selectedRider]);

  // Notificar componente pai quando selectedRider mudar
  useEffect(() => {
    onRiderSelectChange?.(!!selectedRider);
  }, [selectedRider, onRiderSelectChange]);

  // Atualizar localização do mapa quando o usuário compartilhar
  useEffect(() => {
    if (currentLocation) {
      setUserLocation([currentLocation.latitude, currentLocation.longitude]);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          // Se falhar, usar localização padrão (São Paulo)
          console.log('Geolocalização não disponível, usando localização padrão');
        }
      );
    }
  }, [currentLocation]);

  // Por enquanto, grupos com localização não estão implementados
  // A tabela groups não possui colunas latitude/longitude ainda
  // Quando a funcionalidade for implementada, adicionar as colunas e reativar este código

  // Carregar localizações de riders online com perfis
  useEffect(() => {
    const loadOnlineLocations = async () => {
      const { data: locationsData, error } = await supabase
        .from('user_locations')
        .select('*')
        .eq('is_online', true);

      if (!error && locationsData) {
        setOnlineLocations(locationsData);
        
        // Buscar perfis dos riders online
        const userIds = locationsData.map(loc => loc.user_id);
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);

          if (profilesData) {
            const profilesMap = new Map();
            profilesData.forEach(profile => {
              profilesMap.set(profile.id, profile);
            });
            setOnlineRidersProfiles(profilesMap);
          }
        }
      }
    };

    loadOnlineLocations();

    // Atualizar a cada 10 segundos
    const interval = setInterval(loadOnlineLocations, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen pb-20 relative">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/30">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary animate-pulse" />
            <h1 className="font-semibold">Mapa Ao Vivo</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Toggle de Compartilhamento */}
            <div className="flex items-center gap-2">
              <MapPin className={`w-4 h-4 ${isSharing ? 'text-green-500' : 'text-muted-foreground'}`} />
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Compartilhar</span>
                  {locationLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <Switch
                      checked={isSharing}
                      onCheckedChange={toggleSharing}
                      disabled={locationLoading}
                    />
                  )}
                </div>
                {isSharing && (
                  <span className="text-[10px] text-green-500">Ativo</span>
                )}
                {locationError && (
                  <span className="text-[10px] text-destructive">{locationError}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>{onlineRiders.length + onlineLocations.length + (isSharing ? 1 : 0)} online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Map Container */}
      <div className="relative h-[calc(100vh-180px)] bg-secondary overflow-hidden">
        <MapContainer
          center={userLocation}
          zoom={13}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          zoomControl={true}
        >
          {/* Tiles escuros - CartoDB Dark Matter */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={19}
          />

          <MapCenter center={userLocation} />

          {/* Marcador do próprio usuário quando compartilhando */}
          {isSharing && currentLocation && (
            <OwnLocationMarker
              location={currentLocation}
              avatarUrl={currentUserProfile?.avatar_url || undefined}
              speed={currentLocation.speed}
            />
          )}

          {/* Marcadores de Grupos - Desabilitado até implementar colunas latitude/longitude */}
          {/* groupsWithLocation está vazio pois a tabela groups não tem lat/lng */}

          {/* Marcadores de Riders Online (mock data) */}
          {onlineRiders.map((rider) => {
            if (!rider.location) return null;
            return (
              <Marker
                key={rider.id}
                position={[rider.location.lat, rider.location.lng]}
                icon={createRiderMarkerIcon(rider.avatar, rider.speed)}
                eventHandlers={{
                  click: () => setSelectedRider({
                    id: rider.id,
                    name: rider.name,
                    avatar: rider.avatar,
                    bike: rider.bike,
                    speed: rider.speed,
                    level: rider.level,
                    totalKm: rider.totalKm,
                    location: rider.location,
                  }),
                }}
              >
                <Popup>
                  <div className="text-center">
                    <img
                      src={rider.avatar}
                      alt={rider.name}
                      className="w-12 h-12 rounded-full mx-auto mb-2"
                    />
                    <h3 className="font-semibold">{rider.name}</h3>
                    <p className="text-xs text-primary">{rider.speed} km/h</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Marcadores de Riders Online (banco de dados) */}
          {onlineLocations.map((location) => {
            const profile = onlineRidersProfiles.get(location.user_id);
            const avatarUrl = profile?.avatar_url || undefined;
            
            return (
              <Marker
                key={location.id}
                position={[location.latitude, location.longitude]}
                icon={createRiderMarkerIcon(
                  avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
                  location.speed_kmh || undefined
                )}
                eventHandlers={{
                  click: () => {
                    if (profile) {
                      setSelectedRider({
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
                      });
                    }
                  },
                }}
              >
                <Popup>
                  <div className="text-center">
                    {avatarUrl && (
                      <img
                        src={avatarUrl}
                        alt={profile?.name || 'Rider'}
                        className="w-12 h-12 rounded-full mx-auto mb-2"
                      />
                    )}
                    <h3 className="font-semibold">{profile?.name || 'Rider Online'}</h3>
                    {location.speed_kmh && (
                      <p className="text-xs text-primary">{Math.round(location.speed_kmh)} km/h</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Pilotos Próximos - Ícone com Avatares (Arrastável) */}
      <AnimatePresence>
        <motion.div
          drag
          dragMomentum={false}
          dragConstraints={{
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          }}
          dragElastic={0.1}
          onDragEnd={(_, info) => {
            // Salvar posição relativa ao viewport
            setButtonPosition({ x: info.point.x, y: info.point.y });
          }}
          style={{
            position: 'fixed',
            left: buttonPosition.x || 16,
            bottom: showNearbyRiders ? 'auto' : '8rem',
            top: showNearbyRiders ? (buttonPosition.y || window.innerHeight - 200) : 'auto',
            zIndex: showNearbyRiders ? 1001 : 1000,
            transform: showNearbyRiders ? 'translate(-50%, -100%)' : 'none',
          }}
          className="cursor-move"
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
            {(() => {
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

              if (totalRiders === 0) {
                return <Navigation className="w-5 h-5 text-muted-foreground" />;
              }

              return (
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
                        className="w-8 h-8 rounded-full border-2 border-card ring-2 ring-green-500"
                      />
                      {/* Indicador online */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
                    </div>
                  ))}
                  {remainingCount > 0 && (
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-secondary border-2 border-card ring-2 ring-green-500 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-primary">+{remainingCount}</span>
                      </div>
                      {/* Indicador online */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
                    </div>
                  )}
                </div>
              );
            })()}
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
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
                    onClick={() => {
                      setSelectedRider(rider);
                      setShowNearbyRiders(false);
                    }}
                    className="flex-shrink-0 flex items-center gap-2 p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <img src={rider.avatar} alt={rider.name} className="w-8 h-8 rounded-full" />
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
                      onClick={() => {
                        setSelectedRider({
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
                        });
                        setShowNearbyRiders(false);
                      }}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rider Detail Sheet */}
      <AnimatePresence>
        {selectedRider && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedRider(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl p-6 pb-10"
            >
              <button
                onClick={() => setSelectedRider(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <img
                  src={selectedRider.avatar}
                  alt={selectedRider.name}
                  className="w-16 h-16 rounded-full ring-2 ring-primary"
                />
                <div>
                  <h3 className="font-bold text-lg">{selectedRider.name}</h3>
                  {selectedRider.bike && (
                    <p className="text-sm text-muted-foreground">{selectedRider.bike}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {selectedRider.speed !== undefined && (
                  <div className="bg-secondary rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{selectedRider.speed}</p>
                    <p className="text-xs text-muted-foreground">km/h</p>
                  </div>
                )}
                {selectedRider.level !== undefined && (
                  <div className="bg-secondary rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold">{selectedRider.level}</p>
                    <p className="text-xs text-muted-foreground">Nível</p>
                  </div>
                )}
                {selectedRider.totalKm !== undefined && (
                  <div className="bg-secondary rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold">{(selectedRider.totalKm / 1000).toFixed(1)}k</p>
                    <p className="text-xs text-muted-foreground">km total</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {!isOwnRider && selectedRider.id && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (selectedRider.id) {
                        followMutation.mutate({
                          userId: selectedRider.id,
                          isFollowing: followStatus?.isFollowing ?? false,
                        });
                      }
                    }}
                    disabled={followMutation.isPending}
                    className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
                      followStatus?.isFollowing
                        ? 'bg-secondary text-foreground hover:bg-secondary/80'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    {followMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Processando...</span>
                      </>
                    ) : followStatus?.isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>Seguindo</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Seguir no Mapa</span>
                      </>
                    )}
                  </motion.button>
                )}
                <button className="flex-1 py-3 bg-secondary rounded-xl font-semibold">
                  Mensagem
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Group Detail Sheet */}
      <AnimatePresence>
        {selectedGroup && (
          <LocationDetailSheet
            group={selectedGroup}
            onClose={() => setSelectedGroup(null)}
            onNavigate={(lat, lng) => {
              // Opcional: centralizar mapa na localização
              setUserLocation([lat, lng]);
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
};
