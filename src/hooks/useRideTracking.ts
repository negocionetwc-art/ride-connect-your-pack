import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';

type Ride = Database['public']['Tables']['rides']['Row'];
type RideInsert = Database['public']['Tables']['rides']['Insert'];

// Configurações de precisão GPS (similar ao Google Maps/Waze)
const GPS_CONFIG = {
  MIN_ACCURACY: 50,              // metros - rejeitar se pior que isso
  MIN_DISTANCE: 0.005,           // km (5m) - movimento mínimo detectável
  MAX_ACCELERATION: 50,          // km/h/s - aceleração máxima aceitável
  SPEED_SMOOTHING: 0.7,          // fator de suavização (0-1)
  UPDATE_INTERVAL: 1000,         // ms - frequência de atualização
  MAX_BAD_READINGS: 10,          // máximo de leituras ruins consecutivas
  TIMEOUT: 5000,                 // ms - timeout para getCurrentPosition
  MAXIMUM_AGE: 1000,             // ms - idade máxima do cache GPS
};

interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number;
  accuracy?: number;  // precisão em metros
}

interface RideTrackingState {
  currentRide: Ride | null;
  isTracking: boolean;
  currentDistance: number; // em km
  elapsedTime: number; // em segundos
  currentSpeed: number; // em km/h
  currentAccuracy: number; // precisão atual em metros
  averageSpeed: number; // velocidade média
  maxSpeed: number; // velocidade máxima
  routePoints: RoutePoint[];
  photos: string[];
}

export function useRideTracking() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<RideTrackingState>({
    currentRide: null,
    isTracking: false,
    currentDistance: 0,
    elapsedTime: 0,
    currentSpeed: 0,
    currentAccuracy: 0,
    averageSpeed: 0,
    maxSpeed: 0,
    routePoints: [],
    photos: [],
  });

  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const lastSpeedRef = useRef<number>(0);
  const distanceAccumulatorRef = useRef<number>(0);
  const consecutiveBadReadingsRef = useRef<number>(0);

  // Carregar rolê em andamento ao montar
  useEffect(() => {
    const loadActiveRide = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('rides')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'in_progress')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          const routePoints = (data.route_points as unknown as RoutePoint[]) || [];
          const photos = (data.photos as unknown as string[]) || [];
          
          // Calcular velocidade média e máxima dos pontos existentes
          let totalSpeed = 0;
          let maxSpeed = 0;
          let speedCount = 0;
          
          routePoints.forEach(point => {
            if (point.speed && point.speed > 0) {
              totalSpeed += point.speed;
              speedCount++;
              if (point.speed > maxSpeed) maxSpeed = point.speed;
            }
          });
          
          const averageSpeed = speedCount > 0 ? totalSpeed / speedCount : 0;
          
          setState({
            currentRide: data,
            isTracking: true,
            currentDistance: data.distance_km || 0,
            elapsedTime: data.duration_minutes ? data.duration_minutes * 60 : 0,
            currentSpeed: 0,
            currentAccuracy: 0,
            averageSpeed,
            maxSpeed,
            routePoints,
            photos,
          });

          // Calcular tempo decorrido
          const startTime = new Date(data.start_time).getTime();
          const now = Date.now();
          const elapsed = Math.floor((now - startTime) / 1000);
          
          startTimeRef.current = startTime;
          distanceAccumulatorRef.current = data.distance_km || 0;
          
          if (routePoints.length > 0) {
            const lastPoint = routePoints[routePoints.length - 1];
            lastPositionRef.current = {
              lat: lastPoint.lat,
              lng: lastPoint.lng,
            };
            lastTimeRef.current = new Date(lastPoint.timestamp).getTime();
            lastSpeedRef.current = lastPoint.speed || 0;
          }

          // Continuar rastreamento
          startTracking(data.id);
        }
      } catch (err) {
        console.error('Erro ao carregar rolê ativo:', err);
      }
    };

    loadActiveRide();
  }, []);

  // Calcular distância entre dois pontos (Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Atualizar rolê no banco
  const updateRideInDatabase = useCallback(async (rideId: string, updates: Partial<RideInsert>) => {
    try {
      const { error } = await supabase
        .from('rides')
        .update(updates)
        .eq('id', rideId);

      if (error) throw error;
    } catch (err) {
      console.error('Erro ao atualizar rolê:', err);
    }
  }, []);

  // Iniciar rastreamento GPS
  const startTracking = useCallback((rideId: string) => {
    if (!navigator.geolocation) {
      toast({
        title: 'Erro',
        description: 'Geolocalização não é suportada',
        variant: 'destructive',
      });
      return;
    }

    const updateLocation = async (position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;
      const timestamp = new Date().toISOString();
      const now = Date.now();

      // ✅ VALIDAÇÃO 1: Rejeitar GPS impreciso (> 50m)
      if (accuracy > GPS_CONFIG.MIN_ACCURACY) {
        console.warn(`GPS impreciso: ±${accuracy.toFixed(0)}m - ignorando`);
        consecutiveBadReadingsRef.current++;
        
        // Alertar usuário se GPS ruim por muito tempo
        if (consecutiveBadReadingsRef.current >= GPS_CONFIG.MAX_BAD_READINGS) {
          toast({
            title: 'GPS instável ⚠️',
            description: 'Sinal GPS ruim. Tente ir para área aberta.',
            variant: 'destructive',
          });
          consecutiveBadReadingsRef.current = 0; // Reset para não spammar
        }
        return;
      }
      
      consecutiveBadReadingsRef.current = 0; // Reset ao receber leitura boa

      // ✅ VALIDAÇÃO 2: Calcular distância e verificar se é movimento real
      let distance = 0;
      let shouldUpdate = false;
      
      if (lastPositionRef.current && lastTimeRef.current) {
        distance = calculateDistance(
          lastPositionRef.current.lat,
          lastPositionRef.current.lng,
          lat,
          lng
        );
        
        // Filtrar GPS drift (movimentos < 5m)
        if (distance >= GPS_CONFIG.MIN_DISTANCE) {
          shouldUpdate = true;
        } else {
          console.log(`Movimento muito pequeno (${(distance * 1000).toFixed(1)}m) - ignorando drift`);
          return; // Não atualizar para movimentos muito pequenos
        }
      } else {
        // Primeira posição sempre atualiza
        shouldUpdate = true;
      }

      if (!shouldUpdate) return;

      // ✅ VALIDAÇÃO 3: Calcular e validar velocidade
      let speed = position.coords.speed ? position.coords.speed * 3.6 : 0; // m/s para km/h
      
      // Calcular velocidade manualmente se GPS não forneceu
      if (speed === 0 && lastPositionRef.current && lastTimeRef.current && distance > 0) {
        const timeDiff = (now - lastTimeRef.current) / 1000 / 3600; // em horas
        if (timeDiff > 0) {
          speed = distance / timeDiff; // km/h
          console.log(`Velocidade calculada manualmente: ${speed.toFixed(1)} km/h`);
        }
      }
      
      // ✅ VALIDAÇÃO 4: Filtrar picos irreais de velocidade
      if (lastSpeedRef.current > 0 && lastTimeRef.current) {
        const timeDiff = (now - lastTimeRef.current) / 1000; // em segundos
        const maxSpeedChange = GPS_CONFIG.MAX_ACCELERATION * timeDiff;
        
        if (Math.abs(speed - lastSpeedRef.current) > maxSpeedChange) {
          console.warn(`Velocidade irreal: ${lastSpeedRef.current.toFixed(1)} → ${speed.toFixed(1)} km/h - suavizando`);
          // Limitar mudança de velocidade
          speed = lastSpeedRef.current + (speed > lastSpeedRef.current ? maxSpeedChange : -maxSpeedChange);
        }
      }
      
      // ✅ VALIDAÇÃO 5: Suavizar velocidade (filtro média móvel exponencial)
      const smoothedSpeed = lastSpeedRef.current > 0
        ? lastSpeedRef.current * GPS_CONFIG.SPEED_SMOOTHING + speed * (1 - GPS_CONFIG.SPEED_SMOOTHING)
        : speed;

      const routePoint: RoutePoint = { 
        lat, 
        lng, 
        timestamp, 
        speed: smoothedSpeed,
        accuracy 
      };

      setState((prev) => {
        const newDistance = prev.currentDistance + distance;
        distanceAccumulatorRef.current = newDistance;

        const newRoutePoints = [...prev.routePoints, routePoint];
        const elapsed = startTimeRef.current 
          ? Math.floor((Date.now() - startTimeRef.current) / 1000)
          : prev.elapsedTime;

        // Calcular velocidade média e máxima
        const totalSpeed = newRoutePoints.reduce((sum, p) => sum + (p.speed || 0), 0);
        const speedCount = newRoutePoints.filter(p => p.speed && p.speed > 0).length;
        const newAverageSpeed = speedCount > 0 ? totalSpeed / speedCount : 0;
        const newMaxSpeed = Math.max(prev.maxSpeed, smoothedSpeed);

        // Atualizar no banco a cada 10 pontos
        if (newRoutePoints.length % 10 === 0) {
          updateRideInDatabase(rideId, {
            distance_km: newDistance,
            route_points: newRoutePoints as any,
            duration_minutes: Math.floor(elapsed / 60),
          });
        }

        return {
          ...prev,
          currentDistance: newDistance,
          elapsedTime: elapsed,
          currentSpeed: smoothedSpeed,
          currentAccuracy: accuracy,
          averageSpeed: newAverageSpeed,
          maxSpeed: newMaxSpeed,
          routePoints: newRoutePoints,
        };
      });

      lastPositionRef.current = { lat, lng };
      lastTimeRef.current = now;
      lastSpeedRef.current = smoothedSpeed;
    };

    // Watch position com configurações otimizadas
    watchIdRef.current = navigator.geolocation.watchPosition(
      updateLocation,
      (err) => {
        console.error('Erro no rastreamento GPS:', err);
        toast({
          title: 'Erro GPS',
          description: 'Não foi possível obter localização. Verifique se GPS está ativo.',
          variant: 'destructive',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: GPS_CONFIG.TIMEOUT,
        maximumAge: GPS_CONFIG.MAXIMUM_AGE,
      }
    );

    // Atualizar tempo decorrido a cada segundo
    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (!startTimeRef.current) return prev;
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        return { ...prev, elapsedTime: elapsed };
      });
    }, GPS_CONFIG.UPDATE_INTERVAL);
  }, [updateRideInDatabase]);

  // Mutation: Iniciar rolê
  const startRideMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Obter localização inicial
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: GPS_CONFIG.TIMEOUT,
        });
      });

      // Verificar precisão inicial
      if (position.coords.accuracy > GPS_CONFIG.MIN_ACCURACY) {
        throw new Error(`GPS impreciso (±${position.coords.accuracy.toFixed(0)}m). Tente em área aberta.`);
      }

      const startLocation = `${position.coords.latitude}, ${position.coords.longitude}`;
      const initialRoutePoint: RoutePoint = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: new Date().toISOString(),
        speed: position.coords.speed ? position.coords.speed * 3.6 : 0,
        accuracy: position.coords.accuracy,
      };

      const { data, error } = await supabase
        .from('rides')
        .insert({
          user_id: user.id,
          status: 'in_progress',
          start_location: startLocation,
          route_points: [initialRoutePoint] as any,
          distance_km: 0,
        })
        .select()
        .single();

      if (error) throw error;

      return data as Ride;
    },
    onSuccess: (data) => {
      startTimeRef.current = Date.now();
      lastPositionRef.current = {
        lat: (data.route_points as unknown as RoutePoint[])[0]?.lat || 0,
        lng: (data.route_points as unknown as RoutePoint[])[0]?.lng || 0,
      };
      lastTimeRef.current = Date.now();
      lastSpeedRef.current = 0;
      distanceAccumulatorRef.current = 0;
      consecutiveBadReadingsRef.current = 0;

      setState({
        currentRide: data,
        isTracking: true,
        currentDistance: 0,
        elapsedTime: 0,
        currentSpeed: 0,
        currentAccuracy: (data.route_points as unknown as RoutePoint[])[0]?.accuracy || 0,
        averageSpeed: 0,
        maxSpeed: 0,
        routePoints: (data.route_points as unknown as RoutePoint[]) || [],
        photos: (data.photos as unknown as string[]) || [],
      });

      startTracking(data.id);
      
      toast({
        title: 'Rolê iniciado! 🏍️',
        description: 'Seu rastreamento começou',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível iniciar o rolê',
        variant: 'destructive',
      });
    },
  });

  // Mutation: Adicionar foto
  const addPhotoMutation = useMutation({
    mutationFn: async (photoUrl: string) => {
      if (!state.currentRide) throw new Error('Nenhum rolê em andamento');

      const newPhotos = [...state.photos, photoUrl];
      
      await updateRideInDatabase(state.currentRide.id, {
        photos: newPhotos as any,
      });

      setState((prev) => ({
        ...prev,
        photos: newPhotos,
      }));

      return photoUrl;
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a foto',
        variant: 'destructive',
      });
    },
  });

  // Mutation: Finalizar rolê
  const completeRideMutation = useMutation({
    mutationFn: async (data: { description?: string; taggedUsers?: string[] }) => {
      if (!state.currentRide) throw new Error('Nenhum rolê em andamento');

      // Obter localização final
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: GPS_CONFIG.TIMEOUT,
        });
      });

      const endLocation = `${position.coords.latitude}, ${position.coords.longitude}`;
      const endTime = new Date().toISOString();
      const durationMinutes = Math.floor(state.elapsedTime / 60);

      // Parar rastreamento
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      const { data: updatedRide, error } = await supabase
        .from('rides')
        .update({
          status: 'completed',
          end_time: endTime,
          end_location: endLocation,
          distance_km: state.currentDistance,
          duration_minutes: durationMinutes,
          description: data.description || null,
          tagged_users: data.taggedUsers || [],
          route_points: state.routePoints as any,
          photos: state.photos as any,
        })
        .eq('id', state.currentRide.id)
        .select()
        .single();

      if (error) throw error;

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });

      return updatedRide as Ride;
    },
    onSuccess: () => {
      setState({
        currentRide: null,
        isTracking: false,
        currentDistance: 0,
        elapsedTime: 0,
        currentSpeed: 0,
        currentAccuracy: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        routePoints: [],
        photos: [],
      });

      startTimeRef.current = null;
      lastPositionRef.current = null;
      lastTimeRef.current = null;
      lastSpeedRef.current = 0;
      distanceAccumulatorRef.current = 0;
      consecutiveBadReadingsRef.current = 0;

      toast({
        title: 'Rolê finalizado! 🎉',
        description: 'Seu rolê foi salvo com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível finalizar o rolê',
        variant: 'destructive',
      });
    },
  });

  // Mutation: Cancelar rolê
  const cancelRideMutation = useMutation({
    mutationFn: async () => {
      if (!state.currentRide) throw new Error('Nenhum rolê em andamento');

      // Parar rastreamento
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      const { error } = await supabase
        .from('rides')
        .update({ status: 'cancelled' })
        .eq('id', state.currentRide.id);

      if (error) throw error;
    },
    onSuccess: () => {
      setState({
        currentRide: null,
        isTracking: false,
        currentDistance: 0,
        elapsedTime: 0,
        currentSpeed: 0,
        currentAccuracy: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        routePoints: [],
        photos: [],
      });

      startTimeRef.current = null;
      lastPositionRef.current = null;
      lastTimeRef.current = null;
      lastSpeedRef.current = 0;
      distanceAccumulatorRef.current = 0;
      consecutiveBadReadingsRef.current = 0;

      toast({
        title: 'Rolê cancelado',
        description: 'O rolê foi cancelado',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar o rolê',
        variant: 'destructive',
      });
    },
  });

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

  return {
    // Estado
    currentRide: state.currentRide,
    isTracking: state.isTracking,
    currentDistance: state.currentDistance,
    elapsedTime: state.elapsedTime,
    currentSpeed: state.currentSpeed,
    currentAccuracy: state.currentAccuracy,
    averageSpeed: state.averageSpeed,
    maxSpeed: state.maxSpeed,
    routePoints: state.routePoints,
    photos: state.photos,

    // Ações
    startRide: () => startRideMutation.mutate(),
    addPhoto: (photoUrl: string) => addPhotoMutation.mutate(photoUrl),
    completeRide: (data: { description?: string; taggedUsers?: string[] }) =>
      completeRideMutation.mutate(data),
    cancelRide: () => cancelRideMutation.mutate(),

    // Loading states
    isStarting: startRideMutation.isPending,
    isCompleting: completeRideMutation.isPending,
    isCancelling: cancelRideMutation.isPending,
  };
}
