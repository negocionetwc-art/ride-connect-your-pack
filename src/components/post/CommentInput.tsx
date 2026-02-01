import { useState } from 'react';
import { useAddComment } from '@/hooks/useAddComment';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';

interface CommentInputProps {
  postId: string;
}

export const CommentInput = ({ postId }: CommentInputProps) => {
  const [content, setContent] = useState('');
  const { mutate: addComment, isPending } = useAddComment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    addComment(
      { postId, content },
      {
        onSuccess: () => {
          setContent('');
        }
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter para enviar
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Adicione um comentário..."
          className="min-h-[60px] max-h-[120px] resize-none"
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Pressione Ctrl+Enter para enviar
        </p>
      </div>

      <Button
        type="submit"
        size="icon"
        disabled={!content.trim() || isPending}
        className="shrink-0"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </Button>
    </form>
  );
};
