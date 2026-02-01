import { useState, useRef, useCallback } from 'react';
import { Send, Image, Smile, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MessageInputProps {
  conversationId: string;
  onSendMessage: (content: string, type?: 'text' | 'image' | 'voice', mediaUrl?: string) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

export const MessageInput = ({ 
  conversationId, 
  onSendMessage, 
  onTyping,
  disabled 
}: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSend = useCallback(() => {
    if (!message.trim()) return;
    
    onSendMessage(message.trim(), 'text');
    setMessage('');
    onTyping(false);
  }, [message, onSendMessage, onTyping]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    onTyping(value.length > 0);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Apenas imagens são permitidas',
        variant: 'destructive'
      });
      return;
    }

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'A imagem deve ter no máximo 10MB',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const fileName = `${user.id}/images/${Date.now()}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('message-media')
        .upload(fileName, file);

      if (error) throw error;

      // Gerar URL pública
      const { data: urlData } = supabase.storage
        .from('message-media')
        .getPublicUrl(data.path);

      onSendMessage('', 'image', urlData.publicUrl);
      
      toast({
        title: 'Imagem enviada!',
        description: 'Sua imagem foi enviada com sucesso.'
      });
    } catch (error: any) {
      console.error('Erro ao enviar imagem:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível enviar a imagem',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto md:left-auto md:right-auto p-4 border-t border-border/30 bg-background z-50 md:z-auto glass md:bg-background">
      <div className="flex items-end gap-2 max-w-lg mx-auto md:max-w-none">
        {/* Botão de imagem */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
          disabled={disabled || isUploading}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="shrink-0"
        >
          <Image className="w-5 h-5" />
        </Button>

        {/* Input de texto */}
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem..."
            disabled={disabled || isUploading}
            className="min-h-[44px] max-h-[120px] resize-none pr-10"
            rows={1}
          />
        </div>

        {/* Botão de enviar */}
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled || isUploading}
          size="icon"
          className="shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
