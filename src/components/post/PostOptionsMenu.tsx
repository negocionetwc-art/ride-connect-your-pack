import { useState } from 'react';
import { MoreVertical, Edit, Trash2, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PostOptionsMenuProps {
  isAuthor: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReport?: () => void;
}

export const PostOptionsMenu = ({ 
  isAuthor, 
  onEdit, 
  onDelete, 
  onReport 
}: PostOptionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-full hover:bg-secondary/50 transition-colors"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay para fechar */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-8 z-50 w-48 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
            >
              {isAuthor ? (
                <>
                  {/* Opções do autor */}
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onEdit();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-sm font-medium">Editar</span>
                  </button>
                  
                  <div className="h-px bg-border" />
                  
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onDelete();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-destructive/10 text-destructive transition-colors text-left"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Excluir</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Opções para outros usuários */}
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onReport?.();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                  >
                    <Flag className="w-4 h-4" />
                    <span className="text-sm font-medium">Denunciar</span>
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
