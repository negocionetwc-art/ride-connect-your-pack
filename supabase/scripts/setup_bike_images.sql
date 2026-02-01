-- =====================================================
-- SCRIPT COMPLETO PARA FUNCIONALIDADE DE IMAGEM DA MOTO
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. Adicionar coluna bike_image_url na tabela profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'bike_image_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN bike_image_url TEXT;
    COMMENT ON COLUMN public.profiles.bike_image_url IS 'URL da imagem da moto do usuário';
  END IF;
END $$;

-- 2. Criar bucket para imagens de motos
INSERT INTO storage.buckets (id, name, public)
VALUES ('bike-images', 'bike-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Criar policies para o bucket bike-images
-- Policy: Qualquer usuário autenticado pode fazer upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload bike images'
  ) THEN
    CREATE POLICY "Authenticated users can upload bike images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'bike-images');
  END IF;
END $$;

-- Policy: Qualquer usuário autenticado pode atualizar suas próprias imagens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update their own bike images'
  ) THEN
    CREATE POLICY "Users can update their own bike images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'bike-images' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- Policy: Qualquer usuário autenticado pode deletar suas próprias imagens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their own bike images'
  ) THEN
    CREATE POLICY "Users can delete their own bike images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'bike-images' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- Policy: Qualquer pessoa pode visualizar as imagens (público)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can view bike images'
  ) THEN
    CREATE POLICY "Anyone can view bike images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'bike-images');
  END IF;
END $$;

-- Verificação
SELECT 'Migration completa! Verifique abaixo:' as status;
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'bike_image_url'
    ) THEN '✅ Coluna bike_image_url criada'
    ELSE '❌ Erro: Coluna bike_image_url não foi criada'
  END as coluna_status;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'bike-images') 
    THEN '✅ Bucket bike-images criado'
    ELSE '❌ Erro: Bucket bike-images não foi criado'
  END as bucket_status;

SELECT 
  COUNT(*) as policies_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ Policies criadas'
    ELSE '⚠️ Atenção: Policies podem estar incompletas'
  END as policies_status
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%bike images%';
