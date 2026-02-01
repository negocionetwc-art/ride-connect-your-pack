import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MessageSender {
  id: string;
  name: string;
  avatar_url: string | null;
}

export interface SharedPost {
  id: string;
  image_url: string | null;
  caption: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: 'text' | 'image' | 'voice' | 'post_share' | 'reaction';
  content: string | null;
  media_url: string | null;
  post_id: string | null;
  is_read: boolean;
  read_at: string | null;
  reaction: string | null;
  created_at: string;
  updated_at: string;
  sender?: MessageSender;
  post?: SharedPost;
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (
            id, name, avatar_url
          ),
          post:posts (
            id, image_url, caption
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar mensagens:', error);
        throw error;
      }

      return (data || []) as Message[];
    },
    enabled: !!conversationId
  });
}

export function useMessagesRealtime(conversationId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          console.log('Nova mensagem recebida:', payload);
          
          // Buscar mensagem com dados do sender
          const { data: message } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey (
                id, name, avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (message) {
            // Adicionar mensagem ao cache
            queryClient.setQueryData(
              ['messages', conversationId],
              (old: Message[] | undefined) => [...(old || []), message as Message]
            );
          }

          // Invalidar outras queries
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          queryClient.invalidateQueries({ queryKey: ['total-unread-messages'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          // Atualizar mensagem no cache (ex: reação adicionada)
          queryClient.setQueryData(
            ['messages', conversationId],
            (old: Message[] | undefined) => 
              (old || []).map(msg => 
                msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
              )
          );
        }
      )
      .subscribe((status) => {
        console.log(`Status da subscription de mensagens (${conversationId}):`, status);
      });

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, queryClient]);
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
      type = 'text',
      mediaUrl,
      postId
    }: {
      conversationId: string;
      content?: string;
      type?: 'text' | 'image' | 'voice' | 'post_share';
      mediaUrl?: string;
      postId?: string;
    }) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Não autenticado');
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          type,
          content: content || null,
          media_url: mediaUrl || null,
          post_id: postId || null
        })
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (
            id, name, avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Erro ao enviar mensagem:', error);
        throw error;
      }

      return data as Message;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });
}

export function useMarkMessagesAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Não autenticado');
      }

      const { error } = await supabase
        .rpc('mark_messages_as_read', {
          conv_id: conversationId,
          user_uuid: user.id
        });

      if (error) {
        console.error('Erro ao marcar como lidas:', error);
        throw error;
      }
    },
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['total-unread-messages'] });
    }
  });
}

export function useAddReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      reaction
    }: {
      messageId: string;
      reaction: string | null;
    }) => {
      const { error } = await supabase
        .from('messages')
        .update({ reaction })
        .eq('id', messageId);

      if (error) {
        console.error('Erro ao adicionar reação:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  });
}
