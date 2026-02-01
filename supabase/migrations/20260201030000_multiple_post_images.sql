-- =====================================================
-- MIGRATION: Múltiplas Imagens por Post
-- Adiciona suporte para múltiplas imagens em cada post
-- =====================================================

-- 1. Criar tabela post_images para armazenar múltiplas imagens
CREATE TABLE IF NOT EXISTS public.post_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT post_images_order_unique UNIQUE (post_id, order_index)
);

-- 2. Criar índice para melhorar performance nas queries
CREATE INDEX IF NOT EXISTS idx_post_images_post_id ON public.post_images(post_id);
CREATE INDEX IF NOT EXISTS idx_post_images_order ON public.post_images(post_id, order_index);

-- 3. Adicionar comentários
COMMENT ON TABLE public.post_images IS 'Armazena múltiplas imagens para cada post';
COMMENT ON COLUMN public.post_images.order_index IS 'Ordem de exibição das imagens (0 = primeira)';

-- 4. Habilitar RLS
ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;

-- 5. Criar policies RLS
-- Todos podem visualizar as imagens dos posts
CREATE POLICY "Post images are viewable by everyone" ON public.post_images
  FOR SELECT USING (true);

-- Usuários autenticados podem inserir imagens em seus próprios posts
CREATE POLICY "Users can insert images to their own posts" ON public.post_images
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE id = post_id AND user_id = auth.uid()
    )
  );

-- Usuários podem atualizar imagens de seus próprios posts
CREATE POLICY "Users can update their own post images" ON public.post_images
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE id = post_id AND user_id = auth.uid()
    )
  );

-- Usuários podem deletar imagens de seus próprios posts
CREATE POLICY "Users can delete their own post images" ON public.post_images
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE id = post_id AND user_id = auth.uid()
    )
  );

-- 6. Admins podem gerenciar qualquer imagem
CREATE POLICY "Admins can update any post image" ON public.post_images
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any post image" ON public.post_images
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. Migrar imagens existentes da coluna image_url para a nova tabela
INSERT INTO public.post_images (post_id, image_url, order_index)
SELECT id, image_url, 0
FROM public.posts
WHERE image_url IS NOT NULL;

-- 8. Adicionar comentário explicativo (não remover image_url por compatibilidade)
COMMENT ON COLUMN public.posts.image_url IS 'DEPRECATED: Use post_images table. Mantido para compatibilidade.';

-- Verificação
SELECT 'Migration completa! Verifique abaixo:' as status;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'post_images'
    ) THEN '✅ Tabela post_images criada'
    ELSE '❌ Erro: Tabela post_images não foi criada'
  END as table_status;

SELECT 
  COUNT(*) as policies_count,
  CASE 
    WHEN COUNT(*) >= 6 THEN '✅ Policies criadas'
    ELSE '⚠️ Atenção: Policies podem estar incompletas'
  END as policies_status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'post_images';

SELECT 
  COUNT(*) as images_migrated,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*) || ' imagem(ns) migrada(s) para post_images'
    ELSE 'ℹ️ Nenhuma imagem para migrar'
  END as migration_status
FROM post_images;
