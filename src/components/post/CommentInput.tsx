import { useState } from 'react';
import { useAddComment } from '@/hooks/useAddComment';
import { Loader2, Smile } from 'lucide-react';

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

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      {/* Botão de emoji (futuro) */}
      <button 
        type="button"
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        disabled={isPending}
      >
        <Smile className="w-6 h-6" />
      </button>

      {/* Input estilo Instagram */}
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Adicione um comentário..."
        disabled={isPending}
        className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground disabled:opacity-50"
      />

      {/* Botão de publicar */}
      {content.trim() && (
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 text-primary font-semibold text-sm hover:text-primary/80 transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Publicar'
          )}
        </button>
      )}
    </form>
  );
};
