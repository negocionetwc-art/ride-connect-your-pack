import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserLocation = Database['public']['Tables']['user_locations']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface LiveLocationData extends UserLocation {
  profile?: Profile;
}

/**
 * Hook para subscrição em tempo real de localizações de riders
 * Esta é a função que faz o avatar se mover no mapa
 */
export function useLiveLocationTracking() {
  const [liveLocations, setLiveLocations] = useState<Map<string, LiveLocationData>>(new Map());
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    // Carregar localizações iniciais
    const loadInitialLocations = async () => {
      const { data: locationsData, error } = await supabase
        .from('user_locations')
        .select('*')
        .eq('is_online', true);

      if (error) {
        console.error('Erro ao carregar localizações:', error);
        return;
      }

      if (locationsData) {
        // Buscar perfis dos riders online
        const userIds = locationsData.map(loc => loc.user_id);
        let profilesMap = new Map<string, Profile>();
        
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);

          if (profilesData) {
            profilesMap = new Map<string, Profile>();
            profilesData.forEach(profile => {
              profilesMap.set(profile.id, profile);
            });
            setProfiles(profilesMap);
          }
        }

        // Criar mapa de localizações com perfis
        const locationsMap = new Map<string, LiveLocationData>();
        locationsData.forEach(location => {
          locationsMap.set(location.user_id, {
            ...location,
            profile: profilesMap.get(location.user_id),
          });
        });
        setLiveLocations(locationsMap);
      }
    };

    loadInitialLocations();

    // Subscrição em tempo real usando Supabase Realtime
    const channel = supabase
      .channel('live-locations')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'user_locations',
        },
        async (payload) => {
          // Atualizar localização quando houver mudança
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newLocation = payload.new as UserLocation;

            // Se o usuário está offline, remover do mapa
            if (!newLocation.is_online) {
              setLiveLocations(prev => {
                const updated = new Map(prev);
                updated.delete(newLocation.user_id);
                return updated;
              });
              return;
            }

            // Verificar se precisa buscar perfil (se ainda não temos)
            setProfiles(prevProfiles => {
              const existingProfile = prevProfiles.get(newLocation.user_id);
              
              if (!existingProfile) {
                // Buscar perfil assincronamente
                supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', newLocation.user_id)
                  .maybeSingle()
                  .then(({ data: profileData }) => {
                    if (profileData) {
                      setProfiles(current => {
                        const updated = new Map(current);
                        updated.set(profileData.id, profileData);
                        return updated;
                      });
                      
                      // Atualizar localização com o perfil
                      setLiveLocations(current => {
                        const updated = new Map(current);
                        updated.set(newLocation.user_id, {
                          ...newLocation,
                          profile: profileData,
                        });
                        return updated;
                      });
                    } else {
                      // Sem perfil, atualizar localização sem perfil
                      setLiveLocations(current => {
                        const updated = new Map(current);
                        updated.set(newLocation.user_id, {
                          ...newLocation,
                          profile: undefined,
                        });
                        return updated;
                      });
                    }
                  });
              } else {
                // Já temos o perfil, atualizar localização diretamente
                setLiveLocations(current => {
                  const updated = new Map(current);
                  updated.set(newLocation.user_id, {
                    ...newLocation,
                    profile: existingProfile,
                  });
                  return updated;
                });
              }
              
              return prevProfiles;
            });
          } else if (payload.eventType === 'DELETE') {
            // Remover localização quando deletada
            const deletedLocation = payload.old as UserLocation;
            setLiveLocations(prev => {
              const updated = new Map(prev);
              updated.delete(deletedLocation.user_id);
              return updated;
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscrito a live-locations');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro na subscrição de live-locations');
        }
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  // Filtrar apenas riders online (updated_at < 10s)
  const getOnlineRiders = () => {
    const now = Date.now();
    const onlineRiders: LiveLocationData[] = [];

    liveLocations.forEach((location) => {
      const updatedAt = new Date(location.updated_at).getTime();
      const timeSinceUpdate = now - updatedAt;

      // Considerar online se atualizado nos últimos 10 segundos
      if (location.is_online && timeSinceUpdate < 10000) {
        onlineRiders.push(location);
      }
    });

    return onlineRiders;
  };

  return {
    liveLocations,
    onlineRiders: getOnlineRiders(),
    profiles,
  };
}
