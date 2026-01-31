import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LocationData {
  latitude: number;
  longitude: number;
  speed?: number;
}

export const useLocationSharing = () => {
  const [isSharing, setIsSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar estado inicial do banco
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('user_locations')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data && data.is_online) {
          setIsSharing(true);
          setCurrentLocation({
            latitude: data.latitude,
            longitude: data.longitude,
            speed: data.speed_kmh || undefined,
          });
        }
      } catch (err) {
        console.error('Erro ao carregar estado inicial:', err);
      }
    };

    loadInitialState();
  }, []);

  // Salvar localização no banco
  const saveLocationToDatabase = async (location: LocationData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error: dbError } = await supabase
        .from('user_locations')
        .upsert({
          user_id: user.id,
          latitude: location.latitude,
          longitude: location.longitude,
          speed_kmh: location.speed || null,
          is_online: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (dbError) {
        throw dbError;
      }

      setCurrentLocation(location);
    } catch (err: any) {
      console.error('Erro ao salvar localização:', err);
      setError(err.message || 'Erro ao salvar localização');
    }
  };

  // Desabilitar compartilhamento
  const disableSharing = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Parar rastreamento
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Atualizar banco
      const { error: dbError } = await supabase
        .from('user_locations')
        .upsert({
          user_id: user.id,
          latitude: currentLocation?.latitude || 0,
          longitude: currentLocation?.longitude || 0,
          speed_kmh: currentLocation?.speed || null,
          is_online: false,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (dbError) {
        console.error('Erro ao desabilitar compartilhamento:', dbError);
      }

      setIsSharing(false);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao desabilitar compartilhamento:', err);
      setError(err.message || 'Erro ao desabilitar compartilhamento');
    }
  };

  // Habilitar compartilhamento
  const enableSharing = async () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada neste navegador');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Solicitar permissão e obter localização inicial
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            speed: position.coords.speed ? (position.coords.speed * 3.6) : undefined, // Converter m/s para km/h
          };

          await saveLocationToDatabase(location);
          setIsSharing(true);
          setIsLoading(false);

          // Iniciar rastreamento contínuo
          watchIdRef.current = navigator.geolocation.watchPosition(
            async (pos) => {
              const newLocation: LocationData = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                speed: pos.coords.speed ? (pos.coords.speed * 3.6) : undefined,
              };

              // Atualizar a cada 5 segundos
              await saveLocationToDatabase(newLocation);
            },
            (err) => {
              console.error('Erro no rastreamento:', err);
              setError('Erro ao rastrear localização');
              // Não chamar disableSharing aqui para evitar recursão
              // O usuário pode desabilitar manualmente
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 5000,
            }
          );

          // Backup: atualizar manualmente a cada 10 segundos também
          intervalRef.current = setInterval(async () => {
            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                const location: LocationData = {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  speed: pos.coords.speed ? (pos.coords.speed * 3.6) : undefined,
                };
                await saveLocationToDatabase(location);
              },
              (err) => {
                console.error('Erro ao atualizar localização:', err);
              },
              {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 5000,
              }
            );
          }, 10000);
        },
        (err) => {
          setIsLoading(false);
          switch (err.code) {
            case err.PERMISSION_DENIED:
              setError('Permissão de localização negada');
              break;
            case err.POSITION_UNAVAILABLE:
              setError('Localização indisponível');
              break;
            case err.TIMEOUT:
              setError('Tempo esgotado ao obter localização');
              break;
            default:
              setError('Erro ao obter localização');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Erro ao habilitar compartilhamento');
    }
  };

  // Limpar ao desmontar
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const toggleSharing = async () => {
    if (isSharing) {
      await disableSharing();
    } else {
      await enableSharing();
    }
  };

  return {
    isSharing,
    currentLocation,
    error,
    isLoading,
    toggleSharing,
    enableSharing,
    disableSharing,
  };
};
