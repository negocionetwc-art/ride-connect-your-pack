-- =====================================================
-- Storage bucket para imagens de capa de perfil
-- =====================================================

-- Criar bucket para imagens de capa
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-covers', 'profile-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Qualquer usuário autenticado pode fazer upload
CREATE POLICY "Authenticated users can upload profile covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-covers');

-- Policy: Qualquer usuário autenticado pode atualizar suas próprias imagens
CREATE POLICY "Users can update their own profile covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Qualquer usuário autenticado pode deletar suas próprias imagens
CREATE POLICY "Users can delete their own profile covers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Qualquer pessoa pode visualizar as imagens (público)
CREATE POLICY "Anyone can view profile covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-covers');
