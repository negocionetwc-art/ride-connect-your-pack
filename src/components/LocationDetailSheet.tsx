import { motion } from 'framer-motion';
import { X, MapPin, Star, Navigation, MessageSquare } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Group = Database['public']['Tables']['groups']['Row'];

interface LocationDetailSheetProps {
  group: Group;
  onClose: () => void;
  onNavigate?: (lat: number, lng: number) => void;
}

export const LocationDetailSheet = ({ group, onClose }: LocationDetailSheetProps) => {
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

        {/* Header com foto de capa */}
        <div className="relative h-48 overflow-hidden rounded-t-3xl">
          {group.cover_url ? (
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
            </div>
            {group.description && (
              <p className="text-sm text-muted-foreground">{group.description}</p>
            )}
          </div>

          {/* Membros */}
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-primary" />
            <span className="text-sm">{group.member_count} membros</span>
          </div>

          {/* Aviso sobre localização não disponível */}
          <div className="p-4 bg-secondary/50 rounded-xl text-center">
            <p className="text-sm text-muted-foreground">
              Funcionalidade de localização em desenvolvimento.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
