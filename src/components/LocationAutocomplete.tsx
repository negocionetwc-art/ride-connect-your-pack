import { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
import { useLocationAutocomplete } from '@/hooks/useLocationAutocomplete';
import { motion, AnimatePresence } from 'framer-motion';

interface LocationAutocompleteProps {
  value: string;
  onChange: (location: string) => void;
  disabled?: boolean;
}

export const LocationAutocomplete = ({ 
  value, 
  onChange, 
  disabled 
}: LocationAutocompleteProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { query, setQuery, suggestions, isLoading, clearSuggestions } = useLocationAutocomplete();

  // Sincronizar valor externo com query interno
  useEffect(() => {
    if (value !== query) {
      setQuery(value);
    }
  }, [value, query, setQuery]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (suggestion: any) => {
    const locationName = formatLocationName(suggestion);
    onChange(locationName);
    setQuery(locationName);
    setShowSuggestions(false);
    clearSuggestions();
    inputRef.current?.blur();
  };

  const formatLocationName = (suggestion: any): string => {
    // Formatar nome bonito: "Cidade, Estado" ou "Local, Cidade - Estado"
    const { address } = suggestion;
    const parts: string[] = [];
    
    // Prioridade: cidade > vila > bairro
    if (address.city) {
      parts.push(address.city);
    } else if (address.town) {
      parts.push(address.town);
    } else if (address.village) {
      parts.push(address.village);
    } else if (address.suburb) {
      parts.push(address.suburb);
    } else if (address.neighbourhood) {
      parts.push(address.neighbourhood);
    }
    
    // Adicionar estado se disponível
    if (address.state) {
      parts.push(address.state);
    }
    
    // Se não conseguiu formatar, usar display_name
    if (parts.length === 0) {
      // Pegar primeiras 2 partes do display_name
      const displayParts = suggestion.display_name.split(',').slice(0, 2);
      return displayParts.join(',').trim();
    }
    
    return parts.join(', ');
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
    setShowSuggestions(false);
    clearSuggestions();
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (query.length >= 3 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Delay para permitir click em sugestão
    setTimeout(() => {
      setIsFocused(false);
    }, 200);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className={`flex items-center gap-4 p-4 bg-card rounded-xl border transition-colors ${
        isFocused ? 'border-primary' : 'border-border'
      }`}>
        <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
        <div className="flex-1 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Adicionar localização"
            disabled={disabled}
            className="flex-1 bg-transparent text-sm focus:outline-none disabled:opacity-50 placeholder:text-muted-foreground"
          />
          {isLoading && (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          )}
          {query && !isLoading && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-secondary rounded-full transition-colors"
              type="button"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown de Sugestões */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.place_id}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  type="button"
                  className="w-full px-4 py-3 text-left hover:bg-secondary/50 transition-colors border-b border-border last:border-0"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {formatLocationName(suggestion)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {suggestion.display_name}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Créditos OpenStreetMap */}
            <div className="px-4 py-2 bg-secondary/30 border-t border-border">
              <p className="text-[10px] text-muted-foreground text-center">
                Powered by OpenStreetMap
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mensagem quando não há resultados */}
      {showSuggestions && !isLoading && query.length >= 3 && suggestions.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl p-4 text-center"
        >
          <MapPin className="w-8 h-8 mx-auto text-muted-foreground mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground">
            Nenhum local encontrado
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Tente usar o nome da cidade ou estado
          </p>
        </motion.div>
      )}

      {/* Dica quando query muito curto */}
      {isFocused && query.length > 0 && query.length < 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl p-3"
        >
          <p className="text-xs text-muted-foreground text-center">
            Digite pelo menos 3 caracteres para buscar
          </p>
        </motion.div>
      )}
    </div>
  );
};
