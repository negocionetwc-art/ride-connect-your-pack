import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useTypingIndicator(conversationId: string | null) {
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [otherTypingUser, setOtherTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingRef = useRef<number>(0);

  // Observar indicadores de digitação
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const typingUserId = payload.new.user_id;
            
            // Ignorar se for o próprio usuário
            if (typingUserId !== user?.id) {
              setIsOtherTyping(true);
              setOtherTypingUser(typingUserId);
              
              // Auto-limpar após 5 segundos
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
              typingTimeoutRef.current = setTimeout(() => {
                setIsOtherTyping(false);
                setOtherTypingUser(null);
              }, 5000);
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedUserId = payload.old.user_id;
            if (deletedUserId !== user?.id) {
              setIsOtherTyping(false);
              setOtherTypingUser(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId]);

  // Função para atualizar indicador de digitação
  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!conversationId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const now = Date.now();
    
    // Debounce: não enviar mais que 1 vez por segundo
    if (isTyping && now - lastTypingRef.current < 1000) {
      return;
    }
    lastTypingRef.current = now;

    try {
      if (isTyping) {
        await supabase
          .from('typing_indicators')
          .upsert({
            conversation_id: conversationId,
            user_id: user.id,
            started_at: new Date().toISOString()
          }, {
            onConflict: 'conversation_id,user_id'
          });
      } else {
        await supabase
          .from('typing_indicators')
          .delete()
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Erro ao atualizar typing indicator:', error);
    }
  }, [conversationId]);

  // Limpar indicador ao desmontar
  useEffect(() => {
    return () => {
      if (conversationId) {
        setTyping(false);
      }
    };
  }, [conversationId, setTyping]);

  return {
    isOtherTyping,
    otherTypingUser,
    setTyping
  };
}
