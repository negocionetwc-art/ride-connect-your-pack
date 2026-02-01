import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface BikeImageViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  bikeName?: string;
}

export const BikeImageViewer = ({ open, onOpenChange, imageUrl, bikeName }: BikeImageViewerProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-0">
        <div className="relative w-full h-[90vh]">
          {/* Botão de fechar */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Imagem */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full flex items-center justify-center p-4"
          >
            <img
              src={imageUrl}
              alt={bikeName || 'Moto'}
              className="max-w-full max-h-full object-contain"
            />
          </motion.div>

          {/* Nome da moto (se disponível) */}
          {bikeName && (
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white text-center text-lg font-medium">{bikeName}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
