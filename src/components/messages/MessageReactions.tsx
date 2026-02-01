import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MessageReactionsProps {
  messageId: string;
  currentReaction: string | null;
  onReact: (messageId: string, reaction: string | null) => void;
  className?: string;
}

const reactions = [
  { id: 'heart', emoji: '❤️' },
  { id: 'laugh', emoji: '😂' },
  { id: 'thumbs_up', emoji: '👍' },
  { id: 'fire', emoji: '🔥' },
  { id: 'sad', emoji: '😢' }
];

export const MessageReactions = ({ 
  messageId, 
  currentReaction, 
  onReact,
  className 
}: MessageReactionsProps) => {
  const handleReact = (reactionId: string) => {
    // Se já está selecionada, remove. Senão, adiciona.
    onReact(messageId, currentReaction === reactionId ? null : reactionId);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        "flex items-center gap-1 bg-card border border-border rounded-full px-2 py-1 shadow-lg z-10",
        className
      )}
    >
      {reactions.map((reaction) => (
        <button
          key={reaction.id}
          onClick={() => handleReact(reaction.id)}
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center hover:bg-accent transition-colors",
            currentReaction === reaction.id && "bg-primary/20"
          )}
        >
          <span className="text-sm">{reaction.emoji}</span>
        </button>
      ))}
    </motion.div>
  );
};
