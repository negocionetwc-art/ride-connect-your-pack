import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePostComments } from '@/hooks/usePostComments';
import { Loader2 } from 'lucide-react';
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>
            Comentários {comments && comments.length > 0 && `(${comments.length})`}
          </DialogTitle>
        </DialogHeader>

        {/* Preview do post (opcional) */}
        {postImage && (
          <div className="px-6 py-3 bg-accent/30">
            <div className="flex items-center gap-3">
              <img 
                src={postImage} 
                alt="Post preview"
                className="w-16 h-16 object-cover rounded-lg"
              />
              {postCaption && (
                <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                  {postCaption}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Lista de comentários */}
        <ScrollArea className="flex-1 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : comments && comments.length > 0 ? (
            <div className="space-y-4 py-4">
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} postId={postId} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhum comentário ainda</p>
              <p className="text-sm mt-1">Seja o primeiro a comentar!</p>
            </div>
          )}
        </ScrollArea>

        {/* Input de comentário */}
        <div className="px-6 py-4 border-t bg-background">
          <CommentInput postId={postId} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
