import { useState, useEffect, useCallback, useRef } from 'react';

interface LocationSuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

export function useLocationAutocomplete() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Função de busca com debounce manual
  const searchLocations = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q: searchQuery,
          format: 'json',
          addressdetails: '1',
          limit: '5',
          countrycodes: 'br', // Filtrar apenas Brasil
          'accept-language': 'pt-BR',
        }),
        {
          headers: {
            'User-Agent': 'RideConnect/1.0 (Social Network for Motorcyclists)',
          },
        }
      );

      if (!response.ok) throw new Error('Erro ao buscar localizações');

      const data = await response.json();
      setSuggestions(data);
    } catch (err) {
      console.error('Erro ao buscar localizações:', err);
      setError('Não foi possível buscar localizações');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce manual (500ms) para não fazer request a cada tecla
  useEffect(() => {
    // Limpar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Se query vazio, limpar sugestões imediatamente
    if (query.length === 0) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    // Se query muito curto, não buscar
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    // Iniciar loading imediatamente
    setIsLoading(true);

    // Criar novo timer
    debounceTimerRef.current = setTimeout(() => {
      searchLocations(query);
    }, 500);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, searchLocations]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    error,
    clearSuggestions,
  };
}
