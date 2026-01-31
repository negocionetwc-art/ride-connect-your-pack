import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Route, Clock, Calendar } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Post = Database['public']['Tables']['posts']['Row'];

interface RideDetailOverlayProps {
  post: Post;
  open: boolean;
  onClose: () => void;
}

export const RideDetailOverlay = ({ post, open, onClose }: RideDetailOverlayProps) => {
  if (!open) return null;

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background"
        >
          {/* Header */}
          <header className="sticky top-0 z-40 glass border-b border-border/30">
            <div className="flex items-center justify-between px-4 h-14">
              <h1 className="font-semibold text-lg">Detalhes do Rolê</h1>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-full hover:bg-secondary"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </header>

          {/* Content */}
          <div className="pb-20">
            {/* Image */}
            {post.image_url && (
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={post.image_url}
                  alt={post.caption || 'Rolê'}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-4 space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {post.distance_km && (
                  <div className="p-3 bg-card rounded-xl border border-border/50 text-center">
                    <Route className="w-5 h-5 mx-auto text-primary mb-1" />
                    <p className="text-lg font-bold">{post.distance_km} km</p>
                    <p className="text-[10px] text-muted-foreground">Distância</p>
                  </div>
                )}
                {post.duration_minutes && (
                  <div className="p-3 bg-card rounded-xl border border-border/50 text-center">
                    <Clock className="w-5 h-5 mx-auto text-primary mb-1" />
                    <p className="text-lg font-bold">
                      {formatDuration(post.duration_minutes)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Duração</p>
                  </div>
                )}
                {post.created_at && (
                  <div className="p-3 bg-card rounded-xl border border-border/50 text-center">
                    <Calendar className="w-5 h-5 mx-auto text-primary mb-1" />
                    <p className="text-sm font-bold">
                      {new Date(post.created_at).toLocaleDateString('pt-BR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Data</p>
                  </div>
                )}
              </div>

              {/* Location */}
              {post.location && (
                <div className="flex items-center gap-2 p-3 bg-card rounded-xl border border-border/50">
                  <MapPin className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium">{post.location}</p>
                </div>
              )}

              {/* Caption */}
              {post.caption && (
                <div className="p-4 bg-card rounded-xl border border-border/50">
                  <p className="text-sm leading-relaxed">{post.caption}</p>
                </div>
              )}

              {/* Date */}
              {post.created_at && (
                <div className="text-xs text-muted-foreground text-center">
                  Publicado em{' '}
                  {new Date(post.created_at).toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
