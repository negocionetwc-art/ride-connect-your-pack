-- =====================================================
-- SETUP MESSAGE MEDIA STORAGE
-- Bucket para armazenamento de midias de mensagens
-- =====================================================

-- 1. Criar bucket para mensagens (privado - requer autenticacao)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-media',
  'message-media',
  false,
  52428800, -- 50MB limite
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/webm', 'audio/mp3', 'audio/mp4', 'audio/mpeg', 'audio/ogg']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Politicas RLS para o bucket message-media

-- Usuarios autenticados podem fazer upload de midias
CREATE POLICY "Authenticated users can upload message media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'message-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Usuarios podem ver midias em suas conversas
-- (verificacao real de permissao e feita via URL assinada)
CREATE POLICY "Users can view message media"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'message-media');

-- Usuarios podem atualizar seus proprios arquivos
CREATE POLICY "Users can update own message media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'message-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Usuarios podem deletar seus proprios arquivos
CREATE POLICY "Users can delete own message media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'message-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- INSTRUCOES DE USO
-- =====================================================

/*
Para executar este script:

1. Acesse o Supabase Dashboard
2. Va para SQL Editor
3. Cole e execute este script

Estrutura de pastas recomendada:
- message-media/{user_id}/images/{timestamp}_{filename}
- message-media/{user_id}/voice/{timestamp}_{filename}

Exemplo de upload no frontend:
```typescript
const uploadMessageMedia = async (file: File, type: 'images' | 'voice') => {
  const { data: { user } } = await supabase.auth.getUser();
  const fileName = `${user.id}/${type}/${Date.now()}_${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('message-media')
    .upload(fileName, file);
  
  if (error) throw error;
  
  // Gerar URL assinada (valida por 1 hora)
  const { data: urlData } = await supabase.storage
    .from('message-media')
    .createSignedUrl(data.path, 3600);
  
  return urlData.signedUrl;
};
```
*/
