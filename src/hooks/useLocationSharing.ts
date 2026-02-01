import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LocationData {
  latitude: number;
  longitude: number;
  speed?: number;
}

/**
 * Função para iniciar rastreamento contínuo de localização
 * Usa watchPosition() para updates em tempo real
 */
export function startLiveLocationTracking(
  onUpdate: (lat: number, lng: number, speed?: number) => void,
  onError?: (error: GeolocationPositionError) => void
) {
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, speed } = position.coords;
      // Converter m/s para km/h se disponível
      const speedKmh = speed ? speed * 3.6 : undefined;
      onUpdate(latitude, longitude, speedKmh);
    },
    (error) => {
      console.error('Erro ao rastrear localização', error);
      onError?.(error);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 1000, // Aceitar posições com no máximo 1s de idade
      timeout: 10000,
    }
  );

  return () => navigator.geolocation.clearWatch(watchId);
}

export const useLocationSharing = () => {
  const [isSharing, setIsSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const stopTrackingRef = useRef<(() => void) | null>(null);
  const lastDbWriteAtRef = useRef<number>(0);
  const lastSpeedRef = useRef<number>(0);

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

  // Salvar localização no banco com throttle inteligente
  const saveLocationToDatabase = async (location: LocationData) => {
    try {
      // Atualiza o UI imediatamente (mesmo se o DB falhar)
      setCurrentLocation(location);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Throttle inteligente baseado na velocidade
      const now = Date.now();
      const speed = location.speed || 0;
      lastSpeedRef.current = speed;

      // Parado: 1 update a cada 5-10s
      // Em movimento: 1 update por segundo
      // Alta velocidade (>50km/h): 500ms
      let throttleInterval = 10000; // 10s padrão (parado)
      if (speed > 50) {
        throttleInterval = 500; // 500ms em alta velocidade
      } else if (speed > 0) {
        throttleInterval = 1000; // 1s em movimento
      } else {
        throttleInterval = 5000; // 5s parado
      }

      const timeSinceLastWrite = now - lastDbWriteAtRef.current;
      
      // Só escreve no DB se passou o intervalo de throttle
      if (timeSinceLastWrite >= throttleInterval) {
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
        lastDbWriteAtRef.current = now;
      }
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
      if (stopTrackingRef.current) {
        stopTrackingRef.current();
        stopTrackingRef.current = null;
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

          // Iniciar rastreamento contínuo usando watchPosition
          stopTrackingRef.current = startLiveLocationTracking(
            async (lat, lng, speed) => {
              const newLocation: LocationData = {
                latitude: lat,
                longitude: lng,
                speed: speed,
              };

              // O throttle é gerenciado dentro de saveLocationToDatabase
              await saveLocationToDatabase(newLocation);
            },
            (err) => {
              console.error('Erro no rastreamento:', err);
              setError('Erro ao rastrear localização');
              // Não chamar disableSharing aqui para evitar recursão
              // O usuário pode desabilitar manualmente
            }
          );
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
      if (stopTrackingRef.current) {
        stopTrackingRef.current();
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
