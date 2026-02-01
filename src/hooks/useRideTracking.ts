import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';

type Ride = Database['public']['Tables']['rides']['Row'];
type RideInsert = Database['public']['Tables']['rides']['Insert'];

interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number;
}

interface RideTrackingState {
  currentRide: Ride | null;
  isTracking: boolean;
  currentDistance: number; // em km
  elapsedTime: number; // em segundos
  currentSpeed: number; // em km/h
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
    routePoints: [],
    photos: [],
  });

  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const distanceAccumulatorRef = useRef<number>(0);

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
          const routePoints = (data.route_points as RoutePoint[]) || [];
          const photos = (data.photos as string[]) || [];
          
          setState({
            currentRide: data,
            isTracking: true,
            currentDistance: data.distance_km || 0,
            elapsedTime: data.duration_minutes ? data.duration_minutes * 60 : 0,
            currentSpeed: 0,
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
            lastPositionRef.current = {
              lat: routePoints[routePoints.length - 1].lat,
              lng: routePoints[routePoints.length - 1].lng,
            };
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
      const speed = position.coords.speed ? position.coords.speed * 3.6 : 0; // m/s para km/h
      const timestamp = new Date().toISOString();

      const routePoint: RoutePoint = { lat, lng, timestamp, speed };

      setState((prev) => {
        let newDistance = prev.currentDistance;
        
        // Calcular distância incremental
        if (lastPositionRef.current) {
          const distance = calculateDistance(
            lastPositionRef.current.lat,
            lastPositionRef.current.lng,
            lat,
            lng
          );
          newDistance = prev.currentDistance + distance;
          distanceAccumulatorRef.current = newDistance;
        }

        const newRoutePoints = [...prev.routePoints, routePoint];
        const elapsed = startTimeRef.current 
          ? Math.floor((Date.now() - startTimeRef.current) / 1000)
          : prev.elapsedTime;

        // Atualizar no banco a cada 10 pontos ou 30 segundos
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
          currentSpeed: speed,
          routePoints: newRoutePoints,
        };
      });

      lastPositionRef.current = { lat, lng };
    };

    // Watch position
    watchIdRef.current = navigator.geolocation.watchPosition(
      updateLocation,
      (err) => {
        console.error('Erro no rastreamento GPS:', err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // Atualizar tempo decorrido a cada segundo
    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (!startTimeRef.current) return prev;
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        return { ...prev, elapsedTime: elapsed };
      });
    }, 1000);
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
          timeout: 10000,
        });
      });

      const startLocation = `${position.coords.latitude}, ${position.coords.longitude}`;
      const initialRoutePoint: RoutePoint = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: new Date().toISOString(),
        speed: position.coords.speed ? position.coords.speed * 3.6 : 0,
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
        lat: (data.route_points as RoutePoint[])[0]?.lat || 0,
        lng: (data.route_points as RoutePoint[])[0]?.lng || 0,
      };
      distanceAccumulatorRef.current = 0;

      setState({
        currentRide: data,
        isTracking: true,
        currentDistance: 0,
        elapsedTime: 0,
        currentSpeed: 0,
        routePoints: (data.route_points as RoutePoint[]) || [],
        photos: (data.photos as string[]) || [],
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
          timeout: 10000,
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
        routePoints: [],
        photos: [],
      });

      startTimeRef.current = null;
      lastPositionRef.current = null;
      distanceAccumulatorRef.current = 0;

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
        routePoints: [],
        photos: [],
      });

      startTimeRef.current = null;
      lastPositionRef.current = null;
      distanceAccumulatorRef.current = 0;

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
