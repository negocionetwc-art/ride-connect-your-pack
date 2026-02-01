-- =====================================================
-- RIDECONNECT MESSAGING SYSTEM
-- Sistema completo de mensagens estilo Instagram
-- =====================================================

-- 1. ENUM para tipos de mensagem
CREATE TYPE public.message_type AS ENUM (
  'text',
  'image',
  'voice',
  'post_share',
  'reaction'
);

-- 2. Tabela de conversas (threads)
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Ultima mensagem (desnormalizado para performance)
  last_message_text TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  last_message_by UUID REFERENCES public.profiles(id),
  
  -- Contadores de nao lidas por usuario
  unread_count_p1 INTEGER DEFAULT 0,
  unread_count_p2 INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Garantir ordem consistente (menor ID primeiro)
  CONSTRAINT ordered_participants CHECK (participant_1_id < participant_2_id),
  UNIQUE(participant_1_id, participant_2_id)
);

-- 3. Tabela de mensagens
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  type public.message_type NOT NULL DEFAULT 'text',
  content TEXT, -- Texto da mensagem
  media_url TEXT, -- URL da imagem/audio
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL, -- Se for compartilhamento de post
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Reacoes (emoji)
  reaction TEXT, -- Ex: 'heart', 'laugh', 'thumbs_up'
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Mensagem nao pode estar vazia (exceto reacoes)
  CONSTRAINT valid_message CHECK (
    (type = 'text' AND content IS NOT NULL) OR
    (type IN ('image', 'voice') AND media_url IS NOT NULL) OR
    (type = 'post_share' AND post_id IS NOT NULL) OR
    (type = 'reaction')
  )
);

-- 4. Tabela de indicadores de "digitando"
CREATE TABLE public.typing_indicators (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- 5. Indices para performance
CREATE INDEX idx_conversations_participant1 ON public.conversations(participant_1_id, last_message_at DESC);
CREATE INDEX idx_conversations_participant2 ON public.conversations(participant_2_id, last_message_at DESC);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_unread ON public.messages(conversation_id, is_read) WHERE is_read = false;
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_typing_indicators_conversation ON public.typing_indicators(conversation_id);

-- 6. RLS Policies - Conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  USING (
    auth.uid() = participant_1_id OR 
    auth.uid() = participant_2_id
  );

CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (
    auth.uid() = participant_1_id OR 
    auth.uid() = participant_2_id
  );

CREATE POLICY "Users can update own conversations"
  ON public.conversations FOR UPDATE
  USING (
    auth.uid() = participant_1_id OR 
    auth.uid() = participant_2_id
  );

-- 7. RLS Policies - Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in own conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = messages.conversation_id
        AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in own conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
        AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own messages"
  ON public.messages FOR UPDATE
  USING (
    auth.uid() = sender_id OR
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = messages.conversation_id
        AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
    )
  );

-- 8. RLS Policies - Typing Indicators
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own typing indicators"
  ON public.typing_indicators FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view typing in own conversations"
  ON public.typing_indicators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = typing_indicators.conversation_id
        AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
    )
  );

-- =====================================================
-- 9. TRIGGERS E FUNCOES
-- =====================================================

-- Funcao para atualizar conversa ao enviar mensagem
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS TRIGGER AS $$
DECLARE
  other_participant_id UUID;
  is_p1 BOOLEAN;
BEGIN
  -- Atualizar ultima mensagem
  UPDATE public.conversations
  SET 
    last_message_text = CASE 
      WHEN NEW.type = 'text' THEN NEW.content
      WHEN NEW.type = 'image' THEN '[Imagem]'
      WHEN NEW.type = 'voice' THEN '[Audio]'
      WHEN NEW.type = 'post_share' THEN '[Post compartilhado]'
      ELSE '[Mensagem]'
    END,
    last_message_at = NEW.created_at,
    last_message_by = NEW.sender_id,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  -- Determinar quem e o outro participante e incrementar contador
  SELECT 
    CASE 
      WHEN participant_1_id = NEW.sender_id THEN participant_2_id
      ELSE participant_1_id
    END,
    participant_1_id = NEW.sender_id
  INTO other_participant_id, is_p1
  FROM public.conversations
  WHERE id = NEW.conversation_id;
  
  -- Incrementar contador de nao lidas do destinatario
  IF is_p1 THEN
    UPDATE public.conversations
    SET unread_count_p2 = unread_count_p2 + 1
    WHERE id = NEW.conversation_id;
  ELSE
    UPDATE public.conversations
    SET unread_count_p1 = unread_count_p1 + 1
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para atualizar conversa
CREATE TRIGGER on_message_update_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_on_message();

-- Funcao para limpar typing indicators antigos (mais de 5 segundos)
CREATE OR REPLACE FUNCTION public.cleanup_typing_indicators()
RETURNS VOID AS $$
  DELETE FROM public.typing_indicators
  WHERE started_at < now() - INTERVAL '5 seconds';
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Funcao para obter ou criar conversa entre dois usuarios
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Funcao para marcar mensagens como lidas
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(conv_id UUID, user_uuid UUID)
RETURNS VOID AS $$
DECLARE
  is_p1 BOOLEAN;
BEGIN
  -- Marcar mensagens como lidas
  UPDATE public.messages
  SET 
    is_read = true,
    read_at = now()
  WHERE conversation_id = conv_id
    AND sender_id != user_uuid
    AND is_read = false;
  
  -- Zerar contador de nao lidas
  SELECT participant_1_id = user_uuid INTO is_p1
  FROM public.conversations
  WHERE id = conv_id;
  
  IF is_p1 THEN
    UPDATE public.conversations
    SET unread_count_p1 = 0
    WHERE id = conv_id;
  ELSE
    UPDATE public.conversations
    SET unread_count_p2 = 0
    WHERE id = conv_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Funcao para contar total de mensagens nao lidas
CREATE OR REPLACE FUNCTION public.get_total_unread_messages(user_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(
    SUM(
      CASE 
        WHEN participant_1_id = user_uuid THEN unread_count_p1
        ELSE unread_count_p2
      END
    )::INTEGER,
    0
  )
  FROM public.conversations
  WHERE participant_1_id = user_uuid OR participant_2_id = user_uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- =====================================================
-- 10. HABILITAR REALTIME
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;

-- =====================================================
-- 11. COMENTARIOS
-- =====================================================

COMMENT ON TABLE public.conversations IS 'Conversas privadas entre dois usuarios';
COMMENT ON TABLE public.messages IS 'Mensagens enviadas em conversas';
COMMENT ON TABLE public.typing_indicators IS 'Indicadores de usuario digitando (real-time)';
COMMENT ON FUNCTION public.get_or_create_conversation IS 'Obtem ou cria uma conversa entre dois usuarios';
COMMENT ON FUNCTION public.mark_messages_as_read IS 'Marca todas mensagens de uma conversa como lidas';
