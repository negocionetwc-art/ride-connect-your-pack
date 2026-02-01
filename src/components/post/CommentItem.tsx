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
      <div className="flex items-start gap-3 group">
        <Avatar className="w-8 h-8 ring-2 ring-primary/20 shrink-0">
          <AvatarImage 
            src={comment.profile.avatar_url || '/placeholder.svg'} 
            alt={comment.profile.name} 
          />
          <AvatarFallback>{comment.profile.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{comment.profile.name}</span>
            <span className="text-xs text-primary">Lvl {comment.profile.level}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
          </div>

          <p className="text-sm text-foreground/90 break-words">{comment.content}</p>
        </div>

        {/* Botão de deletar (apenas para o autor) */}
        {isAuthor && (
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isPending}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        )}
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
