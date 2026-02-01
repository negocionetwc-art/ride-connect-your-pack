-- =====================================================
-- FIX: Garantir que a função get_or_create_conversation existe
-- =====================================================

-- Funcao para obter ou criar conversa entre dois usuarios
-- Recriar para garantir que está disponível no schema cache
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conv_id UUID;
  p1 UUID;
  p2 UUID;
BEGIN
  -- Ordenar IDs para manter consistencia
  IF user1_id < user2_id THEN
    p1 := user1_id;
    p2 := user2_id;
  ELSE
    p1 := user2_id;
    p2 := user1_id;
  END IF;
  
  -- Tentar encontrar conversa existente
  SELECT id INTO conv_id
  FROM public.conversations
  WHERE participant_1_id = p1 AND participant_2_id = p2;
  
  -- Se nao existir, criar
  IF conv_id IS NULL THEN
    INSERT INTO public.conversations (participant_1_id, participant_2_id)
    VALUES (p1, p2)
    RETURNING id INTO conv_id;
  END IF;
  
  RETURN conv_id;
END;
$$;

-- Comentário na função
COMMENT ON FUNCTION public.get_or_create_conversation IS 'Obtem ou cria uma conversa entre dois usuarios';
