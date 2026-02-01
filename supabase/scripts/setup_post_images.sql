-- =====================================================
-- SCRIPT COMPLETO PARA FUNCIONALIDADE DE IMAGENS DE POSTS
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. Criar bucket para imagens de posts
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Criar policies para o bucket post-images
-- Policy: Qualquer usuário autenticado pode fazer upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload post images'
  ) THEN
    CREATE POLICY "Authenticated users can upload post images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'post-images');
  END IF;
END $$;

-- Policy: Qualquer usuário autenticado pode atualizar suas próprias imagens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update their own post images'
  ) THEN
    CREATE POLICY "Users can update their own post images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- Policy: Qualquer usuário autenticado pode deletar suas próprias imagens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their own post images'
  ) THEN
    CREATE POLICY "Users can delete their own post images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- Policy: Qualquer pessoa pode visualizar as imagens (público)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can view post images'
  ) THEN
    CREATE POLICY "Anyone can view post images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'post-images');
  END IF;
END $$;

-- Verificação
SELECT 'Migration completa! Verifique abaixo:' as status;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'post-images') 
    THEN '✅ Bucket post-images criado'
    ELSE '❌ Erro: Bucket post-images não foi criado'
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
AND policyname LIKE '%post images%';
