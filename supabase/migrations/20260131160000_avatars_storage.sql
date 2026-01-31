-- =====================================================
-- AVATARS STORAGE BUCKET AND POLICIES
-- =====================================================

-- Criar bucket para avatares
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Política: Usuários autenticados podem fazer upload de seus próprios avatares
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Usuários autenticados podem atualizar seus próprios avatares
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Usuários autenticados podem deletar seus próprios avatares
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Avatares são públicos para leitura
CREATE POLICY "Avatars are publicly readable"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');
