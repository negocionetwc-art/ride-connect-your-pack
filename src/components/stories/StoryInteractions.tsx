import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Send, X } from 'lucide-react';
import { useStoryLikes } from '@/hooks/useStoryLikes';
import { useStoryComments } from '@/hooks/useStoryComments';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StoryInteractionsProps {
  storyId: string;
  onPause: () => void;
  onResume: () => void;
}

export function StoryInteractions({ storyId, onPause, onResume }: StoryInteractionsProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { likesCount, isLiked, toggleLike, isToggling } = useStoryLikes(storyId);
  const { comments, commentsCount, addComment, isAddingComment } = useStoryComments(storyId);

  // Pausar story quando abrir comentários
  useEffect(() => {
    if (showComments) {
      onPause();
    } else {
      onResume();
    }
  }, [showComments, onPause, onResume]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike();
  };

  const handleOpenComments = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowComments(true);
  };

  const handleCloseComments = () => {
    setShowComments(false);
    setCommentText('');
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    addComment(commentText, {
      onSuccess: () => {
        setCommentText('');
      },
    });
  };

  return (
    <>
      {/* Botões de interação - fixos no canto inferior */}
      <div 
        className="absolute bottom-6 left-0 right-0 z-50 px-4 flex items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Like button */}
        <motion.button
          className="flex items-center gap-1.5 p-2 rounded-full bg-background/30 backdrop-blur-sm"
          onClick={handleLike}
          disabled={isToggling}
          whileTap={{ scale: 0.9 }}
        >
          <Heart 
            className={`w-6 h-6 transition-colors ${
              isLiked ? 'fill-red-500 text-red-500' : 'text-white'
            }`}
          />
          {likesCount > 0 && (
            <span className="text-white text-sm font-medium">{likesCount}</span>
          )}
        </motion.button>

        {/* Comment button */}
        <motion.button
          className="flex items-center gap-1.5 p-2 rounded-full bg-background/30 backdrop-blur-sm"
          onClick={handleOpenComments}
          whileTap={{ scale: 0.9 }}
        >
          <MessageCircle className="w-6 h-6 text-white" />
          {commentsCount > 0 && (
            <span className="text-white text-sm font-medium">{commentsCount}</span>
          )}
        </motion.button>
      </div>

      {/* Painel de comentários */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            className="absolute inset-0 z-[60] flex flex-col bg-background/95 backdrop-blur-md"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold">Comentários</h3>
              <button
                onClick={handleCloseComments}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de comentários */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                  <p>Nenhum comentário ainda</p>
                  <p className="text-sm">Seja o primeiro a comentar!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={comment.profile?.avatar_url || ''} />
                      <AvatarFallback>{comment.profile?.name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{comment.profile?.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mt-0.5">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input de comentário */}
            <form 
              onSubmit={handleSubmitComment}
              className="p-4 border-t border-border flex gap-2"
            >
              <Input
                ref={inputRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Adicione um comentário..."
                className="flex-1"
                disabled={isAddingComment}
                autoFocus
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={!commentText.trim() || isAddingComment}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
