import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ConversationProfile {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  level: number;
}

export interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message_text: string | null;
  last_message_at: string | null;
  last_message_by: string | null;
  unread_count_p1: number;
  unread_count_p2: number;
  created_at: string;
  updated_at: string;
  participant_1: ConversationProfile;
  participant_2: ConversationProfile;
  // Campos calculados
  otherParticipant?: ConversationProfile;
  unreadCount?: number;
}

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return [];
      }

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participant_1:profiles!conversations_participant_1_id_fkey (
            id, name, username, avatar_url, level
          ),
          participant_2:profiles!conversations_participant_2_id_fkey (
            id, name, username, avatar_url, level
          )
        `)
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('Erro ao buscar conversas:', error);
        throw error;
      }

      // Processar dados para adicionar campos calculados
      const conversations = (data || []).map(conv => {
        const isP1 = conv.participant_1_id === user.id;
        return {
          ...conv,
          otherParticipant: isP1 ? conv.participant_2 : conv.participant_1,
          unreadCount: isP1 ? conv.unread_count_p1 : conv.unread_count_p2
        };
      }) as Conversation[];

      return conversations;
    }
  });
}

export function useGetOrCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Não autenticado');
      }

      // Usar função do banco para obter ou criar conversa
      const { data, error } = await supabase
        .rpc('get_or_create_conversation', {
          user1_id: user.id,
          user2_id: otherUserId
        });

      if (error) {
        console.error('Erro ao criar conversa:', error);
        throw error;
      }

      return data as string; // Retorna o ID da conversa
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });
}

export function useTotalUnreadMessages() {
  return useQuery({
    queryKey: ['total-unread-messages'],
    queryFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return 0;
      }

      const { data, error } = await supabase
        .rpc('get_total_unread_messages', {
          user_uuid: user.id
        });

      if (error) {
        console.error('Erro ao contar mensagens não lidas:', error);
        return 0;
      }

      return data || 0;
    },
    refetchInterval: 30000
  });
}
