-- =====================================================
-- RIDECONNECT NOTIFICATIONS SYSTEM
-- Sistema de notificacoes em tempo real
-- =====================================================

-- 1. ENUM para tipos de notificacao
CREATE TYPE public.notification_type AS ENUM (
  'like',           -- Curtiu seu post
  'comment',        -- Comentou no seu post
  'share',          -- Compartilhou seu post
  'follow',         -- Seguiu voce
  'mention',        -- Mencionou voce em comentario
  'comment_like',   -- Curtiu seu comentario
  'reply'           -- Respondeu seu comentario
);

-- 2. Tabela de notificacoes
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  
  -- Referencias opcionais dependendo do tipo
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  
  -- Metadados
  content TEXT, -- Texto do comentario ou mencao (preview)
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Evitar notificar a si mesmo
  CONSTRAINT different_users CHECK (recipient_id != sender_id)
);

-- 3. Indices para performance
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(recipient_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_sender ON public.notifications(sender_id);
CREATE INDEX idx_notifications_post ON public.notifications(post_id) WHERE post_id IS NOT NULL;

-- 4. RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Usuarios podem ver apenas suas proprias notificacoes
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = recipient_id);

-- Usuarios podem atualizar suas proprias notificacoes (marcar como lida)
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = recipient_id);

-- Sistema pode inserir notificacoes (via trigger)
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Usuarios podem deletar suas proprias notificacoes
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = recipient_id);

-- =====================================================
-- 5. TRIGGERS PARA CRIAR NOTIFICACOES AUTOMATICAMENTE
-- =====================================================

-- Funcao para criar notificacao de curtida em post
CREATE OR REPLACE FUNCTION public.notify_post_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir notificacao para o dono do post (se nao for o proprio usuario)
  INSERT INTO public.notifications (recipient_id, sender_id, type, post_id)
  SELECT p.user_id, NEW.user_id, 'like'::public.notification_type, NEW.post_id
  FROM public.posts p
  WHERE p.id = NEW.post_id
    AND p.user_id != NEW.user_id; -- Nao notificar a si mesmo
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para curtidas em posts
CREATE TRIGGER on_post_like_notify
  AFTER INSERT ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_post_like();

-- Funcao para criar notificacao de comentario
CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir notificacao para o dono do post
  INSERT INTO public.notifications (recipient_id, sender_id, type, post_id, comment_id, content)
  SELECT p.user_id, NEW.user_id, 'comment'::public.notification_type, NEW.post_id, NEW.id, 
         LEFT(NEW.content, 100) -- Limitar preview do comentario
  FROM public.posts p
  WHERE p.id = NEW.post_id
    AND p.user_id != NEW.user_id; -- Nao notificar a si mesmo
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para comentarios
CREATE TRIGGER on_post_comment_notify
  AFTER INSERT ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_post_comment();

-- Funcao para criar notificacao de novo seguidor
CREATE OR REPLACE FUNCTION public.notify_new_follow()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (recipient_id, sender_id, type)
  VALUES (NEW.following_id, NEW.follower_id, 'follow'::public.notification_type);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para novos seguidores
CREATE TRIGGER on_new_follow_notify
  AFTER INSERT ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_follow();

-- =====================================================
-- 6. FUNCOES UTILITARIAS
-- =====================================================

-- Funcao para contar notificacoes nao lidas
CREATE OR REPLACE FUNCTION public.get_unread_notifications_count(user_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.notifications
  WHERE recipient_id = user_uuid
    AND is_read = false;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Funcao para marcar todas como lidas
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(user_uuid UUID)
RETURNS VOID AS $$
  UPDATE public.notifications
  SET is_read = true
  WHERE recipient_id = user_uuid
    AND is_read = false;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- 7. HABILITAR REALTIME
-- =====================================================

-- Habilitar publicacao de mudancas para Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- =====================================================
-- 8. COMENTARIOS
-- =====================================================

COMMENT ON TABLE public.notifications IS 'Sistema de notificacoes para interacoes sociais';
COMMENT ON COLUMN public.notifications.type IS 'Tipo de notificacao (like, comment, follow, etc)';
COMMENT ON COLUMN public.notifications.content IS 'Preview do conteudo (ex: texto do comentario)';
COMMENT ON COLUMN public.notifications.is_read IS 'Se o usuario ja visualizou a notificacao';
