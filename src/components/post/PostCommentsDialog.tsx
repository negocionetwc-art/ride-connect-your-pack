import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePostComments } from '@/hooks/usePostComments';
import { Loader2, X, ChevronLeft } from 'lucide-react';
import { CommentItem } from './CommentItem';
import { CommentInput } from './CommentInput';

interface PostCommentsDialogProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  postImage?: string;
  postCaption?: string;
}

export const PostCommentsDialog = ({ 
  postId, 
  isOpen, 
  onClose,
  postImage,
  postCaption 
}: PostCommentsDialogProps) => {
  const { data: comments, isLoading } = usePostComments(postId);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background"
      >
        {/* Header estilo Instagram */}
        <header className="flex items-center justify-between px-4 h-14 border-b border-border sticky top-0 bg-background z-10">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-secondary"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-semibold text-base">
            Comentários
          </h1>
          <div className="w-10" /> {/* Spacer para centralizar o título */}
        </header>

        {/* Conteúdo */}
        <div className="flex flex-col h-[calc(100vh-3.5rem)]">
          {/* Lista de comentários */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : comments && comments.length > 0 ? (
              <div className="py-2">
                {comments.map((comment) => (
                  <div key={comment.id} className="px-4 py-3 hover:bg-secondary/30 transition-colors">
                    <CommentItem comment={comment} postId={postId} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium">Nenhum comentário ainda</p>
                <p className="text-sm mt-1">Inicie a conversa.</p>
              </div>
            )}
          </ScrollArea>

          {/* Input de comentário fixo no bottom - estilo Instagram */}
          <div className="border-t border-border bg-background p-4 pb-20">
            <CommentInput postId={postId} />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
