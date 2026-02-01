-- Script para configurar o bucket group-covers manualmente no Supabase Dashboard
-- Execute este script no SQL Editor do Supabase se a migration não criar o bucket automaticamente

-- =====================================================
-- CRIAR BUCKET group-covers
-- =====================================================

-- Opção 1: Via SQL (requer permissões apropriadas)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'group-covers',
  'group-covers',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- =====================================================
-- CRIAR POLICIES PARA group-covers
-- =====================================================

-- 1. Policy para visualização pública
CREATE POLICY IF NOT EXISTS "Group covers are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'group-covers');

-- 2. Policy para upload (usuários autenticados)
CREATE POLICY IF NOT EXISTS "Authenticated users can upload group covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'group-covers');

-- 3. Policy para atualização (apenas donos dos arquivos)
CREATE POLICY IF NOT EXISTS "Users can update their own group covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'group-covers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Policy para deleção (apenas donos dos arquivos)
CREATE POLICY IF NOT EXISTS "Users can delete their own group covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'group-covers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar se o bucket foi criado
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'group-covers';

-- Verificar policies
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%group cover%';
