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

      // Tabela conversations pode não existir ainda
      const { data, error } = await (supabase as any)
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
        // Se tabela não existe, retornar array vazio
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          console.warn('Tabela conversations não existe ainda');
          return [];
        }
        console.error('Erro ao buscar conversas:', error);
        throw error;
      }

      // Processar dados para adicionar campos calculados
      const conversations = (data || []).map((conv: any) => {
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

      // Verificar se está seguindo o usuário antes de criar conversa
      const { data: isFollowing, error: followError } = await supabase
        .rpc('is_following', { _profile_id: otherUserId });

      if (followError) {
        console.error('Erro ao verificar follow:', followError);
        // Não bloquear se houver erro na verificação, apenas logar
        // Pode ser que a função não exista ainda ou tenha algum problema
      }

      if (followError === null && isFollowing === false) {
        throw new Error('Você precisa seguir este usuário para enviar mensagens');
      }

      // Tentar usar função do banco para obter ou criar conversa
      let conversationId: string | null = null;
      const { data, error } = await (supabase as any)
        .rpc('get_or_create_conversation', {
          user1_id: user.id,
          user2_id: otherUserId
        });

      if (error) {
        console.error('Erro ao usar função RPC, tentando criar diretamente:', error);
        
        // Verificar se a tabela existe antes de tentar usar
        const { error: tableCheckError } = await (supabase as any)
          .from('conversations')
          .select('id')
          .limit(1);
        
        if (tableCheckError) {
          // Tabela não existe - erro crítico
          throw new Error('A tabela de conversas não existe no banco de dados. Por favor, aplique a migração do sistema de mensagens.');
        }
        
        // Fallback: criar conversa diretamente se a função não existir
        const p1 = user.id < otherUserId ? user.id : otherUserId;
        const p2 = user.id < otherUserId ? otherUserId : user.id;
        
        // Verificar se já existe conversa
        const { data: existingConv, error: selectError } = await (supabase as any)
          .from('conversations')
          .select('id')
          .eq('participant_1_id', p1)
          .eq('participant_2_id', p2)
          .maybeSingle();
        
        if (selectError && selectError.code !== 'PGRST116') {
          console.error('Erro ao verificar conversa existente:', selectError);
          throw selectError;
        }
        
        if (existingConv) {
          conversationId = existingConv.id;
        } else {
          // Criar nova conversa
          const { data: newConv, error: insertError } = await (supabase as any)
            .from('conversations')
            .insert({
              participant_1_id: p1,
              participant_2_id: p2
            })
            .select('id')
            .single();
          
          if (insertError) {
            console.error('Erro ao criar conversa:', insertError);
            throw new Error(`Erro ao criar conversa: ${insertError.message}`);
          }
          
          conversationId = newConv.id;
        }
      } else {
        conversationId = data as string;
      }

      if (!conversationId) {
        throw new Error('Não foi possível criar ou encontrar a conversa');
      }

      return conversationId;
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

      const { data, error } = await (supabase as any)
        .rpc('get_total_unread_messages', {
          user_uuid: user.id
        });

      if (error) {
        // Se função não existe, retornar 0
        if (error.message?.includes('does not exist')) {
          return 0;
        }
        console.error('Erro ao contar mensagens não lidas:', error);
        return 0;
      }

      return data || 0;
    },
    refetchInterval: 30000
  });
}
