import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { useUpdatePost } from '@/hooks/useUpdatePost';

interface EditPostDialogProps {
  postId: string;
  currentCaption: string;
  isOpen: boolean;
  onClose: () => void;
}

const MAX_CAPTION_LENGTH = 2000;

export const EditPostDialog = ({ 
  postId, 
  currentCaption, 
  isOpen, 
  onClose 
}: EditPostDialogProps) => {
  const [caption, setCaption] = useState(currentCaption);
  const { mutate: updatePost, isPending } = useUpdatePost();

  if (!isOpen) return null;

  const handleSave = () => {
    if (!caption.trim()) return;

    updatePost(
      { postId, caption: caption.trim() },
      {
        onSuccess: () => {
          onClose();
        }
      }
    );
  };

  const remainingChars = MAX_CAPTION_LENGTH - caption.length;
  const isOverLimit = remainingChars < 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card rounded-2xl max-w-lg w-full overflow-hidden border border-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-border">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-secondary"
            disabled={isPending}
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="font-semibold">Editar post</h2>
          <button
            onClick={handleSave}
            disabled={isPending || !caption.trim() || isOverLimit}
            className="text-primary font-semibold disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Salvar'
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Escreva uma legenda..."
            disabled={isPending}
            className="w-full h-40 p-4 bg-secondary/30 rounded-xl border border-border resize-none text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            autoFocus
          />
          
          {/* Character count */}
          <div className="flex justify-between items-center mt-2 px-1">
            <span className="text-xs text-muted-foreground">
              {caption.length > 0 && `${caption.length} caracteres`}
            </span>
            <span className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
              {remainingChars < 100 && `${remainingChars} restantes`}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
