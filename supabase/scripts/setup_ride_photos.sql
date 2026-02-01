-- =====================================================
-- SCRIPT PARA CONFIGURAR BUCKET DE FOTOS DE ROLÊS
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. Criar bucket para fotos de rolês
INSERT INTO storage.buckets (id, name, public)
VALUES ('ride-photos', 'ride-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Criar policies para o bucket ride-photos

-- Policy: Qualquer usuário autenticado pode fazer upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload ride photos'
  ) THEN
    CREATE POLICY "Authenticated users can upload ride photos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'ride-photos');
  END IF;
END $$;

-- Policy: Usuários podem atualizar suas próprias fotos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update their own ride photos'
  ) THEN
    CREATE POLICY "Users can update their own ride photos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'ride-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- Policy: Usuários podem deletar suas próprias fotos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their own ride photos'
  ) THEN
    CREATE POLICY "Users can delete their own ride photos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'ride-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- Policy: Qualquer pessoa pode visualizar as fotos (público)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can view ride photos'
  ) THEN
    CREATE POLICY "Anyone can view ride photos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'ride-photos');
  END IF;
END $$;

-- 3. Verificação
SELECT 'Setup completo! Verifique abaixo:' as status;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'ride-photos') 
    THEN '✅ Bucket ride-photos criado'
    ELSE '❌ Erro: Bucket ride-photos não foi criado'
  END as bucket_status;

SELECT 
  COUNT(*) as policies_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ Todas as policies criadas'
    ELSE '⚠️ Atenção: Policies podem estar incompletas'
  END as policies_status
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%ride photos%';

-- 4. Instruções
SELECT '
📋 INSTRUÇÕES PARA TESTAR:

1. Vá até a aba "Rolê" no app
2. Clique em "Iniciar Rolê"
3. Durante o rolê, clique no botão "Foto"
4. Tire uma foto com a câmera
5. A foto deve ser enviada e aparecer em miniatura

Se houver erro, verifique:
- Permissões de geolocalização do navegador
- Permissões de câmera do navegador
- Console do navegador para erros de upload
- Supabase Storage > Buckets > ride-photos
' as instrucoes;
