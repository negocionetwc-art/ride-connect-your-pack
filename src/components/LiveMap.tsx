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
import { useLiveLocationTracking } from '@/hooks/useLiveLocationTracking';
import { Switch } from '@/components/ui/switch';
import { useQuery } from '@tanstack/react-query';
import { useFollow } from '@/hooks/useFollow';
import { useFollowStatus } from '@/hooks/useFollowStatus';
import { useGetOrCreateConversation } from '@/hooks/useConversations';
import { useToast } from '@/hooks/use-toast';

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

const mockOnlineRiders = users.filter(u => u.isOnline);

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

// Componente para renderizar marcadores de riders
function RidersMarkers({
  riders,
  currentUserId,
  onRiderSelect,
}: {
  riders: Array<{
    user_id: string;
    latitude: number | string;
    longitude: number | string;
    speed_kmh?: number | string | null;
    profile?: any;
  }>;
  currentUserId?: string;
  onRiderSelect: (rider: RiderInfo) => void;
}) {
  return (
    <>
      {riders
        .filter((locationData) => locationData.user_id !== currentUserId)
        .map((locationData) => (
          <RiderMarker
            key={locationData.user_id}
            location={{
              latitude: Number(locationData.latitude),
              longitude: Number(locationData.longitude),
            }}
            profile={locationData.profile}
            speed={locationData.speed_kmh ? Number(locationData.speed_kmh) : undefined}
            onSelect={() => {
              if (locationData.profile) {
                onRiderSelect({
                  id: locationData.user_id,
                  name: locationData.profile.name,
                  avatar: locationData.profile.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
                  bike: locationData.profile.bike || undefined,
                  speed: locationData.speed_kmh ? Math.round(Number(locationData.speed_kmh)) : undefined,
                  level: locationData.profile.level,
                  totalKm: locationData.profile.total_km,
                  location: {
                    lat: Number(locationData.latitude),
                    lng: Number(locationData.longitude),
                  },
                });
              }
            }}
          />
        ))}
    </>
  );
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
  const previousPositionRef = useRef<[number, number] | null>(null);
  
  useEffect(() => {
    if (markerRef.current) {
      const newPosition: [number, number] = [location.latitude, location.longitude];
      
      // Se temos uma posição anterior, fazer movimento suave
      if (previousPositionRef.current) {
        const [prevLat, prevLng] = previousPositionRef.current;
        const latDiff = Math.abs(newPosition[0] - prevLat);
        const lngDiff = Math.abs(newPosition[1] - prevLng);
        
        // Se a mudança for pequena, fazer interpolação suave
        if (latDiff < 0.001 && lngDiff < 0.001) {
          // Usar setLatLng que já tem animação suave no Leaflet
          markerRef.current.setLatLng(newPosition);
        } else {
          // Mudança grande, atualizar diretamente
          markerRef.current.setLatLng(newPosition);
        }
      } else {
        // Primeira posição, definir diretamente
        markerRef.current.setLatLng(newPosition);
      }
      
      previousPositionRef.current = newPosition;
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

// Componente para marcador de rider com movimento suave
function RiderMarker({ 
  location, 
  profile,
  onSelect,
  speed
}: { 
  location: { latitude: number; longitude: number }; 
  profile?: any;
  onSelect: () => void;
  speed?: number;
}) {
  const markerRef = useRef<L.Marker | null>(null);
  const previousPositionRef = useRef<[number, number] | null>(null);
  
  useEffect(() => {
    if (markerRef.current) {
      const newPosition: [number, number] = [location.latitude, location.longitude];
      
      // Se temos uma posição anterior, fazer movimento suave
      if (previousPositionRef.current) {
        const [prevLat, prevLng] = previousPositionRef.current;
        const latDiff = Math.abs(newPosition[0] - prevLat);
        const lngDiff = Math.abs(newPosition[1] - prevLng);
        
        // Se a mudança for pequena, fazer interpolação suave
        if (latDiff < 0.001 && lngDiff < 0.001) {
          // Usar setLatLng que já tem animação suave no Leaflet
          markerRef.current.setLatLng(newPosition);
        } else {
          // Mudança grande, atualizar diretamente
          markerRef.current.setLatLng(newPosition);
        }
      } else {
        // Primeira posição, definir diretamente
        markerRef.current.setLatLng(newPosition);
      }
      
      previousPositionRef.current = newPosition;
    }
  }, [location.latitude, location.longitude]);

  const avatarUrl = profile?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop';

  return (
    <Marker
      ref={markerRef}
      position={[location.latitude, location.longitude]}
      icon={createRiderMarkerIcon(avatarUrl, speed)}
      eventHandlers={{
        click: onSelect,
      }}
    >
      <Popup>
        <div className="text-center">
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt={profile?.name || 'Rider'}
              className="w-12 h-12 rounded-full mx-auto mb-2 object-cover aspect-square"
            />
          )}
          <h3 className="font-semibold">{profile?.name || 'Rider Online'}</h3>
          {speed !== undefined && (
            <p className="text-xs text-primary">{Math.round(speed)} km/h</p>
          )}
        </div>
      </Popup>
    </Marker>
  );
}


interface LiveMapProps {
  onRiderSelectChange?: (isOpen: boolean) => void;
  selectedRider?: any;
  onRiderSelect?: (rider: any) => void;
  onMessageClick?: (conversationId?: string) => void;
}

export const LiveMap = ({ onRiderSelectChange, selectedRider: externalSelectedRider, onRiderSelect, onMessageClick }: LiveMapProps) => {
  const [internalSelectedRider, setInternalSelectedRider] = useState<RiderInfo | null>(null);
  const selectedRider = externalSelectedRider !== undefined ? externalSelectedRider : internalSelectedRider;
  const setSelectedRider = onRiderSelect || ((rider: RiderInfo | null) => {
    setInternalSelectedRider(rider);
    onRiderSelectChange?.(!!rider);
  });
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [userLocation, setUserLocation] = useState<LatLngExpression>([-23.5505, -46.6333]); // São Paulo padrão
  const [groupsWithLocation, setGroupsWithLocation] = useState<Group[]>([]);

  // Hook de compartilhamento de localização
  const {
    isSharing,
    currentLocation,
    error: locationError,
    isLoading: locationLoading,
    toggleSharing,
  } = useLocationSharing();

  // Hook de subscrição em tempo real de localizações
  const { onlineRiders } = useLiveLocationTracking();

  // Buscar perfil do usuário atual para avatar
  const { data: currentUserProfile } = useQuery({
    queryKey: ['current-user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      return data;
    },
  });

  // Hook para seguir/deseguir
  const followMutation = useFollow();
  const { data: followStatus } = useFollowStatus(selectedRider?.id);
  
  // Hook para criar/abrir conversa
  const { mutate: getOrCreateConversation, isPending: isCreatingConversation } = useGetOrCreateConversation();
  const { toast } = useToast();
  
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

  // Removido: polling substituído por subscrição realtime via useLiveLocationTracking

  return (
    <div className="fixed inset-0 flex flex-col" style={{ height: '100vh' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/30 flex-shrink-0">
        <div className="flex items-center justify-between px-4 h-16 gap-3">
          {/* Título */}
          <div className="flex items-center gap-2 min-w-0 flex-shrink">
            <Radio className="w-5 h-5 text-primary animate-pulse flex-shrink-0" />
            <h1 className="font-semibold text-base whitespace-nowrap truncate">Mapa Ao Vivo</h1>
          </div>
          
          {/* Controles do lado direito */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Toggle de Compartilhamento */}
            <div className="flex items-center gap-2">
              <MapPin className={`w-4 h-4 flex-shrink-0 ${isSharing ? 'text-green-500' : 'text-muted-foreground'}`} />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">Compartilhar</span>
                {locationLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                ) : (
                  <Switch
                    checked={isSharing}
                    onCheckedChange={toggleSharing}
                    disabled={locationLoading}
                  />
                )}
              </div>
              {isSharing && (
                <span className="text-[10px] text-green-500 whitespace-nowrap hidden sm:inline">Ativo</span>
              )}
              {locationError && (
                <span className="text-[10px] text-destructive whitespace-nowrap truncate max-w-[80px]" title={locationError}>
                  {locationError}
                </span>
              )}
            </div>
            
            {/* Contador de online */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
              <span className="hidden sm:inline">{onlineRiders.length + mockOnlineRiders.length + (isSharing ? 1 : 0)} online</span>
              <span className="sm:hidden">{onlineRiders.length + mockOnlineRiders.length + (isSharing ? 1 : 0)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Map Container */}
      <div className="relative flex-1 bg-secondary overflow-hidden">
        <MapContainer
          center={userLocation}
          zoom={13}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          zoomControl={true}
          attributionControl={false}
        >
          {/* Tiles escuros - CartoDB Dark Matter */}
          <TileLayer
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
          {mockOnlineRiders.map((rider) => {
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
                      className="w-12 h-12 rounded-full mx-auto mb-2 object-cover aspect-square"
                    />
                    <h3 className="font-semibold">{rider.name}</h3>
                    <p className="text-xs text-primary">{rider.speed} km/h</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Marcadores de Riders Online (tempo real via Realtime) */}
          <RidersMarkers 
            riders={onlineRiders}
            currentUserId={currentUserProfile?.id}
            onRiderSelect={setSelectedRider}
          />
        </MapContainer>
      </div>

      {/* Pilotos Próximos removido - agora é um componente global em Index.tsx */}

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
                  className="w-16 h-16 rounded-full ring-2 ring-primary object-cover aspect-square"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate">{selectedRider.name}</h3>
                  {selectedRider.bike && (
                    <p className="text-sm text-muted-foreground truncate">{selectedRider.bike}</p>
                  )}
                  {/* Contadores de Seguidores e Seguindo */}
                  {followStatus && (
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold">{followStatus.followersCount}</span>
                        <span className="text-xs text-muted-foreground">seguidores</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold">{followStatus.followingCount}</span>
                        <span className="text-xs text-muted-foreground">seguindo</span>
                      </div>
                    </div>
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
                        <span>Seguir</span>
                      </>
                    )}
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (!selectedRider?.id) return;
                    
                    getOrCreateConversation(selectedRider.id, {
                      onSuccess: (conversationId) => {
                        toast({
                          title: 'Conversa criada!',
                          description: 'Redirecionando para mensagens...',
                        });
                        // Chamar callback para abrir mensagens com o ID da conversa
                        if (onMessageClick) {
                          onMessageClick(conversationId);
                        }
                        // Fechar o card do rider
                        setSelectedRider(null);
                      },
                      onError: (error: any) => {
                        toast({
                          title: 'Erro ao criar conversa',
                          description: error.message || 'Não foi possível iniciar a conversa',
                          variant: 'destructive',
                        });
                      },
                    });
                  }}
                  disabled={isCreatingConversation || !selectedRider?.id}
                  className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
                    isCreatingConversation || !selectedRider?.id
                      ? 'bg-secondary/50 text-muted-foreground cursor-not-allowed'
                      : 'bg-secondary text-foreground hover:bg-secondary/80'
                  }`}
                >
                  {isCreatingConversation ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Processando...</span>
                    </>
                  ) : (
                    'Mensagem'
                  )}
                </motion.button>
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
