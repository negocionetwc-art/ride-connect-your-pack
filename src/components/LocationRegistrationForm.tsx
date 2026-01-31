import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Search, Phone, Globe, Upload, Trash2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { LatLng } from 'leaflet';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { createGroupMarkerIcon } from './MapMarker';

type Group = Database['public']['Tables']['groups']['Row'];

interface LocationRegistrationFormProps {
  group: Group;
  onClose: () => void;
  onSuccess?: () => void;
}

// Componente para capturar cliques no mapa
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export const LocationRegistrationForm = ({
  group,
  onClose,
  onSuccess,
}: LocationRegistrationFormProps) => {
  const [latitude, setLatitude] = useState<number | null>(group.latitude);
  const [longitude, setLongitude] = useState<number | null>(group.longitude);
  const [address, setAddress] = useState(group.address || '');
  const [phone, setPhone] = useState(group.phone || '');
  const [website, setWebsite] = useState(group.website || '');
  const [isVisibleOnMap, setIsVisibleOnMap] = useState(group.is_visible_on_map || false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializar com localização atual do usuário se não houver localização do grupo
  useEffect(() => {
    if (!latitude || !longitude) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLatitude(position.coords.latitude);
            setLongitude(position.coords.longitude);
          },
          () => {
            // Usar São Paulo como padrão
            setLatitude(-23.5505);
            setLongitude(-46.6333);
          }
        );
      } else {
        setLatitude(-23.5505);
        setLongitude(-46.6333);
      }
    }
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    // Tentar buscar endereço via geocoding reverso (opcional)
    // Por enquanto, apenas atualizar coordenadas
  };

  const handleSearchAddress = async () => {
    if (!searchQuery.trim()) return;

    // Usar Nominatim (OpenStreetMap) para geocoding
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();

      if (data.length > 0) {
        const result = data[0];
        setLatitude(parseFloat(result.lat));
        setLongitude(parseFloat(result.lon));
        setAddress(result.display_name);
      } else {
        setError('Endereço não encontrado');
      }
    } catch (err) {
      setError('Erro ao buscar endereço');
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos = [...photos, ...files];
    setPhotos(newPhotos);

    // Criar previews
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPhotoPreviews([...photoPreviews, ...newPreviews]);
  };

  const handlePhotoRemove = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviews = photoPreviews.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setPhotoPreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!latitude || !longitude) {
      setError('Por favor, selecione uma localização no mapa');
      setLoading(false);
      return;
    }

    try {
      // Atualizar grupo com informações de localização
      const { error: updateError } = await supabase
        .from('groups')
        .update({
          latitude,
          longitude,
          address: address || null,
          phone: phone || null,
          website: website || null,
          is_visible_on_map: isVisibleOnMap,
        })
        .eq('id', group.id);

      if (updateError) throw updateError;

      // Upload de fotos (se houver)
      if (photos.length > 0) {
        try {
          const uploadPromises = photos.map(async (photo, index) => {
            const fileExt = photo.name.split('.').pop();
            const fileName = `${group.id}/${Date.now()}_${index}.${fileExt}`;

            // Upload para Supabase Storage
            // Nota: É necessário criar o bucket 'location-photos' no Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('location-photos')
              .upload(fileName, photo);

            if (uploadError) {
              // Se o bucket não existir, usar URL temporária ou pular upload
              console.warn('Erro ao fazer upload da foto:', uploadError);
              // Por enquanto, usar uma URL temporária base64 ou pular
              // Em produção, criar o bucket no Supabase Storage
              return;
            }

            // Obter URL pública
            const { data: urlData } = supabase.storage
              .from('location-photos')
              .getPublicUrl(fileName);

            // Inserir registro na tabela location_photos
            const { error: photoError } = await supabase
              .from('location_photos')
              .insert({
                group_id: group.id,
                photo_url: urlData.publicUrl,
                uploaded_by: group.owner_id,
                display_order: index,
              });

            if (photoError) {
              console.warn('Erro ao salvar registro da foto:', photoError);
            }
          });

          await Promise.all(uploadPromises);
        } catch (photoErr) {
          // Não falhar o cadastro se houver erro no upload de fotos
          console.warn('Algumas fotos não puderam ser enviadas:', photoErr);
        }
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar localização');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-card border-b border-border/50 p-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold">Cadastrar Localização</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Busca de Endereço */}
          <div>
            <label className="text-sm font-medium mb-2 block">Buscar Endereço</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchAddress())}
                  placeholder="Digite um endereço..."
                  className="w-full pl-10 pr-4 py-2 bg-secondary rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <button
                type="button"
                onClick={handleSearchAddress}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Buscar
              </button>
            </div>
          </div>

          {/* Mapa para Seleção */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Clique no mapa para selecionar a localização
            </label>
            <div className="h-64 rounded-xl overflow-hidden border border-border">
              {latitude && longitude && (
                <MapContainer
                  center={[latitude, longitude]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    subdomains="abcd"
                    maxZoom={19}
                  />
                  <MapClickHandler onMapClick={handleMapClick} />
                  <Marker
                    position={[latitude, longitude]}
                    icon={createGroupMarkerIcon()}
                  />
                </MapContainer>
              )}
            </div>
            {latitude && longitude && (
              <p className="text-xs text-muted-foreground mt-2">
                Coordenadas: {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </p>
            )}
          </div>

          {/* Endereço */}
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Endereço Completo
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: Rua Exemplo, 123 - São Paulo, SP"
              className="w-full px-4 py-2 bg-secondary rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Telefone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full px-4 py-2 bg-secondary rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Website */}
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Website
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://exemplo.com.br"
              className="w-full px-4 py-2 bg-secondary rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Fotos */}
          <div>
            <label className="text-sm font-medium mb-2 block">Fotos do Local</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {photoPreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handlePhotoRemove(index)}
                    className="absolute top-1 right-1 p-1 bg-destructive rounded-full"
                  >
                    <Trash2 className="w-3 h-3 text-destructive-foreground" />
                  </button>
                </div>
              ))}
              {photoPreviews.length < 9 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Adicione até 9 fotos do local
            </p>
          </div>

          {/* Visibilidade no Mapa */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="visibleOnMap"
              checked={isVisibleOnMap}
              onChange={(e) => setIsVisibleOnMap(e.target.checked)}
              className="w-4 h-4 rounded border-border"
            />
            <label htmlFor="visibleOnMap" className="text-sm">
              Tornar este local visível no mapa para outros usuários
            </label>
          </div>

          {/* Erro */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-xl text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-secondary rounded-xl font-semibold hover:bg-secondary/80 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !latitude || !longitude}
              className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar Localização'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
