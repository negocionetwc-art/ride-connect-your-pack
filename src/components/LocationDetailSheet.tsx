import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Phone, Globe, Star, ChevronLeft, ChevronRight, Navigation, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Group = Database['public']['Tables']['groups']['Row'];
type LocationPhoto = Database['public']['Tables']['location_photos']['Row'];
type LocationReview = Database['public']['Tables']['location_reviews']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'] | null;
};

interface LocationDetailSheetProps {
  group: Group;
  onClose: () => void;
  onNavigate?: (lat: number, lng: number) => void;
}

export const LocationDetailSheet = ({ group, onClose, onNavigate }: LocationDetailSheetProps) => {
  const [photos, setPhotos] = useState<LocationPhoto[]>([]);
  const [reviews, setReviews] = useState<LocationReview[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Carregar fotos
      const { data: photosData } = await supabase
        .from('location_photos')
        .select('*')
        .eq('group_id', group.id)
        .order('display_order', { ascending: true });

      if (photosData) {
        setPhotos(photosData);
      }

      // Carregar avaliações com perfis
      const { data: reviewsData } = await supabase
        .from('location_reviews')
        .select(`
          *,
          profiles:profiles!location_reviews_user_id_fkey(*)
        `)
        .eq('group_id', group.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reviewsData) {
        setReviews(reviewsData as LocationReview[]);
      }

      setLoading(false);
    };

    loadData();
  }, [group.id]);

  const handleNavigate = (app: 'google' | 'waze') => {
    if (!group.latitude || !group.longitude) return;

    if (app === 'google') {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${group.latitude},${group.longitude}`,
        '_blank'
      );
    } else if (app === 'waze') {
      window.open(
        `https://waze.com/ul?ll=${group.latitude},${group.longitude}&navigate=yes`,
        '_blank'
      );
    }

    if (onNavigate) {
      onNavigate(group.latitude, group.longitude);
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
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
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {loading ? (
          <div className="p-6 flex items-center justify-center min-h-[400px]">
            <div className="text-muted-foreground">Carregando...</div>
          </div>
        ) : (
          <>
            {/* Header com foto de capa */}
            <div className="relative h-48 overflow-hidden rounded-t-3xl">
              {photos.length > 0 ? (
                <>
                  <img
                    src={photos[currentPhotoIndex].photo_url}
                    alt={group.name}
                    className="w-full h-full object-cover"
                  />
                  {photos.length > 1 && (
                    <>
                      <button
                        onClick={prevPhoto}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 text-white" />
                      </button>
                      <button
                        onClick={nextPhoto}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 text-white" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                        {photos.map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full ${
                              index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : group.cover_url ? (
                <img
                  src={group.cover_url}
                  alt={group.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <div className="text-4xl">🏍️</div>
                </div>
              )}
            </div>

            <div className="p-6 space-y-6">
              {/* Informações do Grupo */}
              <div>
                <h2 className="text-2xl font-bold mb-2">{group.name}</h2>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                    {group.category}
                  </span>
                  {averageRating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-primary text-primary" />
                      <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({reviews.length})</span>
                    </div>
                  )}
                </div>
                {group.description && (
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                )}
              </div>

              {/* Localização e Contato */}
              <div className="space-y-3">
                {group.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Endereço</p>
                      <p className="text-sm text-muted-foreground">{group.address}</p>
                    </div>
                  </div>
                )}

                {group.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                    <a
                      href={`tel:${group.phone}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {group.phone}
                    </a>
                  </div>
                )}

                {group.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-primary flex-shrink-0" />
                    <a
                      href={group.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {group.website}
                    </a>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              {group.latitude && group.longitude && (
                <div className="space-y-3">
                  <button
                    onClick={() => handleNavigate('google')}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                  >
                    <Navigation className="w-5 h-5" />
                    Navegar com Google Maps
                  </button>
                  <button
                    onClick={() => handleNavigate('waze')}
                    className="w-full py-3 bg-secondary rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors"
                  >
                    <Navigation className="w-5 h-5" />
                    Navegar com Waze
                  </button>
                </div>
              )}

              {/* Galeria de Fotos */}
              {photos.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Fotos</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((photo, index) => (
                      <button
                        key={photo.id}
                        onClick={() => setCurrentPhotoIndex(index)}
                        className="aspect-square rounded-xl overflow-hidden"
                      >
                        <img
                          src={photo.photo_url}
                          alt={photo.caption || `Foto ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Avaliações */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Avaliações
                  </h3>
                  {reviews.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'}
                    </span>
                  )}
                </div>

                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-secondary rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {review.profiles?.avatar_url && (
                              <img
                                src={review.profiles.avatar_url}
                                alt={review.profiles.name}
                                className="w-8 h-8 rounded-full"
                              />
                            )}
                            <div>
                              <p className="text-sm font-medium">
                                {review.profiles?.name || 'Usuário'}
                              </p>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < review.rating
                                        ? 'fill-primary text-primary'
                                        : 'text-muted-foreground'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Ainda não há avaliações para este local.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};
