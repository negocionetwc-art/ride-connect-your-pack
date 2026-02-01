import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Heart, MessageCircle, Share2, UserPlus, AtSign, ThumbsUp, Reply } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Notification } from '@/hooks/useNotifications';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

const notificationConfig = {
  like: {
    icon: Heart,
    iconClass: 'text-red-500',
    getMessage: (name: string) => `${name} curtiu seu post`
  },
  comment: {
    icon: MessageCircle,
    iconClass: 'text-blue-500',
    getMessage: (name: string) => `${name} comentou no seu post`
  },
  share: {
    icon: Share2,
    iconClass: 'text-green-500',
    getMessage: (name: string) => `${name} compartilhou seu post`
  },
  follow: {
    icon: UserPlus,
    iconClass: 'text-purple-500',
    getMessage: (name: string) => `${name} começou a seguir você`
  },
  mention: {
    icon: AtSign,
    iconClass: 'text-orange-500',
    getMessage: (name: string) => `${name} mencionou você`
  },
  comment_like: {
    icon: ThumbsUp,
    iconClass: 'text-yellow-500',
    getMessage: (name: string) => `${name} curtiu seu comentário`
  },
  reply: {
    icon: Reply,
    iconClass: 'text-cyan-500',
    getMessage: (name: string) => `${name} respondeu seu comentário`
  }
};

export const NotificationItem = ({ notification, onClick }: NotificationItemProps) => {
  const config = notificationConfig[notification.type];
  const Icon = config.icon;
  const senderName = notification.sender?.name || 'Alguém';

  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 p-4 hover:bg-accent/50 cursor-pointer transition-colors border-b border-border/30",
        !notification.is_read && "bg-primary/5"
      )}
    >
      {/* Avatar com ícone de tipo */}
      <div className="relative">
        <Avatar className="w-12 h-12 ring-2 ring-primary/20">
          <AvatarImage 
            src={notification.sender?.avatar_url || '/placeholder.svg'} 
            alt={senderName} 
          />
          <AvatarFallback>
            {senderName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {/* Badge do tipo de notificação */}
        <div className={cn(
          "absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-background flex items-center justify-center",
          config.iconClass
        )}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-semibold">{senderName}</span>{' '}
          <span className="text-muted-foreground">
            {config.getMessage(senderName).replace(senderName, '')}
          </span>
        </p>
        
        {/* Preview do comentário */}
        {notification.content && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            "{notification.content}"
          </p>
        )}
        
        {/* Timestamp */}
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { 
            addSuffix: true, 
            locale: ptBR 
          })}
        </p>
      </div>

      {/* Preview do post (se houver) */}
      {notification.post?.image_url && (
        <div className="shrink-0">
          <img 
            src={notification.post.image_url} 
            alt="Post" 
            className="w-12 h-12 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Indicador de não lida */}
      {!notification.is_read && (
        <div className="shrink-0">
          <div className="w-2 h-2 rounded-full bg-primary" />
        </div>
      )}
    </div>
  );
};
