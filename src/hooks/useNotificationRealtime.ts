import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useNotificationRealtime() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  // Obter ID do usuário atual
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();

    // Escutar mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Configurar Realtime
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`
        },
        async (payload) => {
          console.log('Nova notificação recebida:', payload);

          // Buscar dados completos da notificação (com sender)
          const { data: notification } = await supabase
            .from('notifications')
            .select(`
              *,
              sender:profiles!notifications_sender_id_fkey (
                id, name, username, avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (notification) {
            // Mostrar toast com a notificação
            const senderName = notification.sender?.name || 'Alguém';
            let message = '';

            switch (notification.type) {
              case 'like':
                message = `${senderName} curtiu seu post`;
                break;
              case 'comment':
                message = `${senderName} comentou: "${notification.content?.substring(0, 50)}..."`;
                break;
              case 'follow':
                message = `${senderName} começou a seguir você`;
                break;
              case 'share':
                message = `${senderName} compartilhou seu post`;
                break;
              case 'mention':
                message = `${senderName} mencionou você`;
                break;
              default:
                message = `${senderName} interagiu com você`;
            }

            toast({
              title: 'Nova Notificação',
              description: message,
            });
          }

          // Invalidar queries para atualizar a UI
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
        }
      )
      .subscribe((status) => {
        console.log('Status da subscription de notificações:', status);
      });

    return () => {
      console.log('Desconectando canal de notificações');
      channel.unsubscribe();
    };
  }, [userId, queryClient, toast]);

  return { isConnected: !!userId };
}
