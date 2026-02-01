import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NotificationSender {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
}

export interface NotificationPost {
  id: string;
  image_url: string | null;
  caption: string | null;
}

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string;
  type: 'like' | 'comment' | 'share' | 'follow' | 'mention' | 'comment_like' | 'reply';
  post_id: string | null;
  comment_id: string | null;
  content: string | null;
  is_read: boolean;
  created_at: string;
  sender: NotificationSender;
  post: NotificationPost | null;
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return [];
      }

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          recipient_id,
          sender_id,
          type,
          post_id,
          comment_id,
          content,
          is_read,
          created_at,
          sender:profiles!notifications_sender_id_fkey (
            id,
            name,
            username,
            avatar_url
          ),
          post:posts (
            id,
            image_url,
            caption
          )
        `)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erro ao buscar notificações:', error);
        throw error;
      }

      return (data || []) as unknown as Notification[];
    }
  });
}

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: ['unread-notifications-count'],
    queryFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return 0;
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Erro ao contar notificações:', error);
        return 0;
      }

      return count || 0;
    },
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    }
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Não autenticado');
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    }
  });
}
