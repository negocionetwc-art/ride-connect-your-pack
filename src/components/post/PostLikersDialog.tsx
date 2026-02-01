import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePostLikers } from '@/hooks/usePostLikers';
import { Loader2 } from 'lucide-react';
import { LikerItem } from './LikerItem';

interface PostLikersDialogProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PostLikersDialog = ({ postId, isOpen, onClose }: PostLikersDialogProps) => {
  const { data: likers, isLoading } = usePostLikers(postId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Curtidas {likers && likers.length > 0 && `(${likers.length})`}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : likers && likers.length > 0 ? (
            <div className="space-y-2">
              {likers.map((liker) => (
                <LikerItem key={liker.id} liker={liker} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma curtida ainda</p>
              <p className="text-sm mt-1">Seja o primeiro a curtir!</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
