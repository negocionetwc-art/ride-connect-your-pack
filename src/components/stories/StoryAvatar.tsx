import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface StoryAvatarProps {
  avatarUrl: string | null;
  name: string;
  hasActiveStory: boolean;
  hasUnviewedStory?: boolean;
  isOwnStory?: boolean;
  onClick: () => void;
  onAddClick?: () => void;
  delay?: number;
}

export function StoryAvatar({
  avatarUrl,
  name,
  hasActiveStory,
  hasUnviewedStory = false,
  isOwnStory = false,
  onClick,
  onAddClick,
  delay = 0,
}: StoryAvatarProps) {
  // Determinar o estilo da borda
  const getBorderStyle = () => {
    if (isOwnStory && !hasActiveStory) {
      // Sem story ativo - borda cinza
      return 'bg-muted';
    }
    if (hasUnviewedStory) {
      // Story não visto - gradiente colorido
      return 'bg-gradient-to-br from-primary via-orange-500 to-yellow-500';
    }
    if (hasActiveStory) {
      // Story ativo do próprio usuário - gradiente colorido
      if (isOwnStory) {
        return 'bg-gradient-to-br from-primary via-orange-500 to-yellow-500';
      }
      // Story já visto de outro usuário - borda cinza
      return 'bg-muted-foreground/30';
    }
    return 'bg-muted';
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Se é o próprio usuário e tem story ativo, abrir visualização
    // Se não tem story ativo, abrir tela de adicionar
    if (isOwnStory && !hasActiveStory && onAddClick) {
      onAddClick();
    } else {
      onClick();
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddClick?.();
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay * 0.05 }}
      onClick={handleAvatarClick}
      className="flex flex-col items-center gap-1.5 flex-shrink-0"
      aria-label={isOwnStory ? (hasActiveStory ? 'Ver seu story' : 'Adicionar Story') : `Ver story de ${name}`}
    >
      <div className={`relative p-0.5 rounded-full ${getBorderStyle()}`}>
        <div className="p-0.5 bg-background rounded-full">
          <div className="relative w-16 h-16 rounded-full overflow-hidden">
            <img
              src={avatarUrl || '/placeholder.svg'}
              alt={name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
        
        {/* Ícone + para adicionar story - sempre visível no próprio avatar */}
        {isOwnStory && (
          <div 
            onClick={handleAddClick}
            className="absolute -bottom-1 -right-1 w-[26px] h-[26px] rounded-full bg-primary border-2 border-background flex items-center justify-center shadow-sm cursor-pointer hover:scale-110 transition-transform"
          >
            <Plus className="w-4 h-4 text-primary-foreground" strokeWidth={3} />
          </div>
        )}
      </div>
      
      <span className="text-xs text-foreground/80 max-w-[70px] truncate text-center">
        {isOwnStory ? 'Seu story' : name.split(' ')[0]}
      </span>
    </motion.button>
  );
}
