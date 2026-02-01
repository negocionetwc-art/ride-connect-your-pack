-- =====================================================
-- SCRIPT DE TESTE - FUNCIONALIDADE NOVA PUBLICAÇÃO
-- Execute este script para verificar se tudo está configurado
-- =====================================================

-- 1. Verificar se o bucket post-images existe
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'post-images') 
    THEN '✅ Bucket post-images existe'
    ELSE '❌ ERRO: Bucket post-images NÃO existe - Execute setup_post_images.sql'
  END as bucket_status;

-- 2. Verificar se o bucket é público
SELECT 
  CASE 
    WHEN public = true THEN '✅ Bucket post-images é público'
    ELSE '⚠️ AVISO: Bucket post-images NÃO é público'
  END as public_status
FROM storage.buckets 
WHERE id = 'post-images';

-- 3. Contar policies do bucket
SELECT 
  COUNT(*) as total_policies,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ Todas as policies estão configuradas (4)'
    WHEN COUNT(*) > 0 THEN '⚠️ AVISO: Algumas policies estão faltando (' || COUNT(*) || '/4)'
    ELSE '❌ ERRO: Nenhuma policy configurada'
  END as policies_status
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%post images%';

-- 4. Listar todas as policies do bucket
SELECT 
  policyname as policy_name,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%post images%'
ORDER BY cmd;

-- 5. Verificar policies RLS da tabela posts
SELECT 
  COUNT(*) as total_policies,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ Policies da tabela posts estão configuradas'
    ELSE '⚠️ AVISO: Verifique as policies da tabela posts'
  END as posts_policies_status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'posts';

-- 6. Listar policies da tabela posts
SELECT 
  policyname as policy_name,
  cmd as operation,
  qual as using_expression
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'posts'
ORDER BY cmd;

-- 7. Contar posts existentes
SELECT 
  COUNT(*) as total_posts,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Existem ' || COUNT(*) || ' post(s) no banco'
    ELSE 'ℹ️ INFO: Nenhum post criado ainda'
  END as posts_count
FROM posts;

-- 8. Verificar últimos 5 posts
SELECT 
  id,
  user_id,
  CASE 
    WHEN image_url IS NOT NULL THEN '🖼️ Com imagem'
    ELSE '📝 Apenas texto'
  END as tipo,
  CASE 
    WHEN caption IS NOT NULL THEN LEFT(caption, 50) || '...'
    ELSE '(sem legenda)'
  END as legenda_preview,
  location,
  likes_count,
  comments_count,
  created_at
FROM posts
ORDER BY created_at DESC
LIMIT 5;

-- 9. Verificar estrutura da tabela posts
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'posts'
ORDER BY ordinal_position;

-- 10. Resumo final
SELECT 
  '=== RESUMO DA CONFIGURAÇÃO ===' as titulo;

SELECT 
  CASE 
    WHEN (
      EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'post-images') AND
      (SELECT COUNT(*) FROM pg_policies 
       WHERE schemaname = 'storage' 
       AND tablename = 'objects' 
       AND policyname LIKE '%post images%') >= 4 AND
      (SELECT COUNT(*) FROM pg_policies 
       WHERE schemaname = 'public' 
       AND tablename = 'posts') >= 4
    ) THEN '✅ TUDO CONFIGURADO CORRETAMENTE! Você pode usar a funcionalidade Nova Publicação.'
    ELSE '❌ CONFIGURAÇÃO INCOMPLETA. Verifique os itens acima e execute os scripts necessários.'
  END as status_final;
