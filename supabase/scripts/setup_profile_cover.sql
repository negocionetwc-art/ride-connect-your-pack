-- =====================================================
-- SCRIPT COMPLETO PARA FUNCIONALIDADE DE CAPA DO PERFIL
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. Adicionar coluna cover_url na tabela profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'cover_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN cover_url TEXT;
    COMMENT ON COLUMN public.profiles.cover_url IS 'URL da imagem de capa do perfil do usuário';
  END IF;
END $$;

-- 2. Criar bucket para imagens de capa
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-covers', 'profile-covers', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Criar policies para o bucket profile-covers
-- Policy: Qualquer usuário autenticado pode fazer upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload profile covers'
  ) THEN
    CREATE POLICY "Authenticated users can upload profile covers"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'profile-covers');
  END IF;
END $$;

-- Policy: Qualquer usuário autenticado pode atualizar suas próprias imagens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update their own profile covers'
  ) THEN
    CREATE POLICY "Users can update their own profile covers"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'profile-covers' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- Policy: Qualquer usuário autenticado pode deletar suas próprias imagens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their own profile covers'
  ) THEN
    CREATE POLICY "Users can delete their own profile covers"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'profile-covers' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- Policy: Qualquer pessoa pode visualizar as imagens (público)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can view profile covers'
  ) THEN
    CREATE POLICY "Anyone can view profile covers"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'profile-covers');
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
      AND column_name = 'cover_url'
    ) THEN '✅ Coluna cover_url criada'
    ELSE '❌ Erro: Coluna cover_url não foi criada'
  END as coluna_status;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-covers') 
    THEN '✅ Bucket profile-covers criado'
    ELSE '❌ Erro: Bucket profile-covers não foi criado'
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
AND policyname LIKE '%profile covers%';
