import { motion } from 'framer-motion';
import { X, MapPin } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Group = Database['public']['Tables']['groups']['Row'];

interface LocationRegistrationFormProps {
  group: Group;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LocationRegistrationForm = ({
  group,
  onClose,
}: LocationRegistrationFormProps) => {
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

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-primary" />
            <span className="text-lg font-medium">{group.name}</span>
          </div>

          {/* Aviso sobre funcionalidade em desenvolvimento */}
          <div className="p-4 bg-secondary/50 rounded-xl text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Funcionalidade de cadastro de localização em desenvolvimento.
            </p>
            <p className="text-xs text-muted-foreground">
              Esta funcionalidade requer tabelas adicionais no banco de dados 
              (latitude, longitude, address, phone, website, location_photos, location_reviews).
            </p>
          </div>

          {/* Botão de Fechar */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-secondary rounded-xl font-semibold hover:bg-secondary/80 transition-colors"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
