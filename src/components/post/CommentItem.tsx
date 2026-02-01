import { useState } from 'react';
import { PostComment } from '@/hooks/usePostComments';
import { useDeleteComment } from '@/hooks/useDeleteComment';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CommentItemProps {
  comment: PostComment;
  postId: string;
}

export const CommentItem = ({ comment, postId }: CommentItemProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { mutate: deleteComment, isPending } = useDeleteComment();

  // Verificar se é o autor do comentário
  useState(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  });

  const isAuthor = currentUserId === comment.user_id;

  const handleDelete = () => {
    deleteComment(
      { commentId: comment.id, postId },
      {
        onSuccess: () => {
          setShowDeleteDialog(false);
        }
      }
    );
  };

  return (
    <>
      <div className="flex items-start gap-3">
        <Avatar className="w-9 h-9 shrink-0">
          <AvatarImage 
            src={comment.profile.avatar_url || '/placeholder.svg'} 
            alt={comment.profile.name} 
          />
          <AvatarFallback>{comment.profile.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-semibold">{comment.profile.name}</span>
                {' '}
                <span className="text-foreground/90">{comment.content}</span>
              </p>
              
              {/* Meta info - estilo Instagram */}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>
                  {formatDistanceToNow(new Date(comment.created_at), { 
                    addSuffix: false, 
                    locale: ptBR 
                  })}
                </span>
                <button className="font-medium hover:text-foreground">
                  Responder
                </button>
                {/* Botão de deletar inline (apenas para o autor) */}
                {isAuthor && (
                  <button 
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isPending}
                    className="font-medium text-destructive hover:text-destructive/80"
                  >
                    Excluir
                  </button>
                )}
              </div>
            </div>

            {/* Contador de curtidas - estilo Instagram */}
            <button className="shrink-0 p-1">
              <svg 
                className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir comentário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O comentário será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
