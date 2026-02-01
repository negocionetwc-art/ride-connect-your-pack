import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Share2, Link2, MessageCircle, Send, Mail } from 'lucide-react';
import { useState } from 'react';

interface SharePostDialogProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  postCaption?: string;
}

export const SharePostDialog = ({ postId, isOpen, onClose, postCaption }: SharePostDialogProps) => {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  const postUrl = `${window.location.origin}/post/${postId}`;
  const shareText = postCaption 
    ? `Confira este post no RideConnect: ${postCaption.substring(0, 100)}${postCaption.length > 100 ? '...' : ''}`
    : 'Confira este post no RideConnect!';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      toast({
        title: 'Link copiado!',
        description: 'O link do post foi copiado para a área de transferência.',
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o link.',
        variant: 'destructive'
      });
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      toast({
        title: 'Não suportado',
        description: 'Seu navegador não suporta compartilhamento nativo.',
        variant: 'destructive'
      });
      return;
    }

    setIsSharing(true);
    try {
      await navigator.share({
        title: 'RideConnect Post',
        text: shareText,
        url: postUrl
      });
      toast({
        title: 'Compartilhado!',
        description: 'Post compartilhado com sucesso.',
      });
      onClose();
    } catch (error: any) {
      // Usuário cancelou o compartilhamento - não mostrar erro
      if (error.name !== 'AbortError') {
        toast({
          title: 'Erro',
          description: 'Não foi possível compartilhar o post.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${postUrl}`)}`;
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  const handleTelegram = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, '_blank');
    onClose();
  };

  const handleEmail = () => {
    const subject = encodeURIComponent('Confira este post no RideConnect');
    const body = encodeURIComponent(`${shareText}\n\n${postUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {/* Web Share API (Mobile) */}
          {navigator.share && (
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleNativeShare}
              disabled={isSharing}
            >
              <Share2 className="w-5 h-5" />
              <span>Compartilhar via...</span>
            </Button>
          )}

          {/* Copiar Link */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={handleCopyLink}
          >
            <Link2 className="w-5 h-5" />
            <span>Copiar link</span>
          </Button>

          {/* WhatsApp */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={handleWhatsApp}
          >
            <MessageCircle className="w-5 h-5 text-green-600" />
            <span>WhatsApp</span>
          </Button>

          {/* Telegram */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={handleTelegram}
          >
            <Send className="w-5 h-5 text-blue-500" />
            <span>Telegram</span>
          </Button>

          {/* Email */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={handleEmail}
          >
            <Mail className="w-5 h-5 text-orange-600" />
            <span>Email</span>
          </Button>
        </div>

        <div className="mt-4 p-3 bg-accent rounded-lg">
          <p className="text-xs text-muted-foreground break-all">
            {postUrl}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
