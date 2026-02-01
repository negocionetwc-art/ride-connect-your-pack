-- =====================================================
-- RIDECONNECT STORIES SYSTEM ENHANCEMENT
-- Sistema completo de Stories com suporte a imagem/vídeo
-- =====================================================

-- 1. CRIAR ENUM PARA TIPO DE MÍDIA
DO $$ BEGIN
  CREATE TYPE public.story_media_type AS ENUM ('image', 'video');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. ADICIONAR CAMPOS À TABELA STORIES
-- Adicionar media_type
ALTER TABLE public.stories
ADD COLUMN IF NOT EXISTS media_type public.story_media_type NOT NULL DEFAULT 'image';

-- Adicionar media_url (manter image_url para compatibilidade)
ALTER TABLE public.stories
ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Atualizar media_url com valores de image_url se media_url estiver vazio
UPDATE public.stories
SET media_url = COALESCE(image_url, '')
WHERE media_url IS NULL;

-- Tornar media_url NOT NULL após migração (com valor padrão para compatibilidade)
DO $$ 
BEGIN
  -- Só alterar se a coluna ainda permitir NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stories' 
    AND column_name = 'media_url' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.stories ALTER COLUMN media_url SET DEFAULT '';
    ALTER TABLE public.stories ALTER COLUMN media_url SET NOT NULL;
  END IF;
END $$;

-- 3. GARANTIR QUE EXPIRES_AT SEJA SEMPRE CREATED_AT + 24H
-- Criar trigger para garantir expires_at correto
CREATE OR REPLACE FUNCTION public.set_story_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL OR NEW.expires_at <= NEW.created_at THEN
    NEW.expires_at := NEW.created_at + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger (usar CREATE OR REPLACE não funciona para triggers, então verificamos antes)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_story_expires_at_trigger'
  ) THEN
    CREATE TRIGGER set_story_expires_at_trigger
      BEFORE INSERT OR UPDATE ON public.stories
      FOR EACH ROW
      EXECUTE FUNCTION public.set_story_expires_at();
  END IF;
END $$;

-- 4. CRIAR BUCKET DE STORAGE PARA STORIES
INSERT INTO storage.buckets (id, name, public)
VALUES ('stories', 'stories', true)
ON CONFLICT (id) DO NOTHING;

-- 5. POLÍTICAS DE STORAGE PARA STORIES
-- Verificar e criar policies apenas se não existirem
DO $$ 
BEGIN
  -- Política: Usuários autenticados podem fazer upload de seus próprios stories
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload their own stories'
  ) THEN
    CREATE POLICY "Users can upload their own stories"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'stories' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;

  -- Política: Usuários autenticados podem atualizar seus próprios stories
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update their own stories'
  ) THEN
    CREATE POLICY "Users can update their own stories"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'stories' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;

  -- Política: Usuários autenticados podem deletar seus próprios stories
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their own stories'
  ) THEN
    CREATE POLICY "Users can delete their own stories"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'stories' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;

  -- Política: Stories são públicos para leitura
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Stories are publicly readable'
  ) THEN
    CREATE POLICY "Stories are publicly readable"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'stories');
  END IF;
END $$;

-- 6. FUNÇÃO PARA BUSCAR STORIES ATIVOS COM STATUS DE VISUALIZAÇÃO
CREATE OR REPLACE FUNCTION public.get_active_stories_with_views(user_uuid UUID)
RETURNS TABLE (
  story_id UUID,
  user_id UUID,
  media_url TEXT,
  media_type public.story_media_type,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  profile_id UUID,
  profile_name TEXT,
  profile_username TEXT,
  profile_avatar_url TEXT,
  is_viewed BOOLEAN,
  viewed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS story_id,
    s.user_id,
    s.media_url,
    s.media_type,
    s.created_at,
    s.expires_at,
    p.id AS profile_id,
    p.name AS profile_name,
    p.username AS profile_username,
    p.avatar_url AS profile_avatar_url,
    COALESCE(sv.id IS NOT NULL, false) AS is_viewed,
    sv.viewed_at
  FROM public.stories s
  INNER JOIN public.profiles p ON s.user_id = p.id
  LEFT JOIN public.story_views sv ON s.id = sv.story_id AND sv.viewer_id = user_uuid
  WHERE s.expires_at > now()
  ORDER BY 
    s.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 7. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_stories_media_type ON public.stories(media_type);
CREATE INDEX IF NOT EXISTS idx_stories_media_url ON public.stories(media_url);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer ON public.story_views(viewer_id, viewed_at DESC);

-- 8. HABILITAR REALTIME PARA STORIES E STORY_VIEWS
-- Adicionar tabelas ao Realtime (ignorar erro se já estiverem adicionadas)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'stories' 
    AND schemaname = 'public'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'story_views' 
    AND schemaname = 'public'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.story_views;
  END IF;
END $$;

-- 9. COMENTÁRIOS
COMMENT ON COLUMN public.stories.media_type IS 'Tipo de mídia: image ou video';
COMMENT ON COLUMN public.stories.media_url IS 'URL da mídia (imagem ou vídeo)';
COMMENT ON COLUMN public.stories.expires_at IS 'Data de expiração (sempre created_at + 24h)';
COMMENT ON FUNCTION public.get_active_stories_with_views IS 'Busca stories ativos agrupados com status de visualização do usuário';
