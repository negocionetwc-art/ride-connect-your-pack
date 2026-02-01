import { motion, AnimatePresence } from 'framer-motion';
import { useUnreadNotificationsCount } from '@/hooks/useNotifications';

interface NotificationBadgeProps {
  className?: string;
}

export const NotificationBadge = ({ className = '' }: NotificationBadgeProps) => {
  const { data: count } = useUnreadNotificationsCount();

  if (!count || count === 0) return null;

  return (
    <AnimatePresence>
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center 
          bg-primary text-primary-foreground text-[10px] font-bold rounded-full ${className}`}
      >
        {count > 99 ? '99+' : count}
      </motion.span>
    </AnimatePresence>
  );
};
