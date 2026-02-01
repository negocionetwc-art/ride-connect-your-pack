-- =====================================================
-- Storage bucket para imagens de motos
-- =====================================================

-- Criar bucket para imagens de motos
INSERT INTO storage.buckets (id, name, public)
VALUES ('bike-images', 'bike-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Qualquer usuário autenticado pode fazer upload
CREATE POLICY "Authenticated users can upload bike images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'bike-images');

-- Policy: Qualquer usuário autenticado pode atualizar suas próprias imagens
CREATE POLICY "Users can update their own bike images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'bike-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Qualquer usuário autenticado pode deletar suas próprias imagens
CREATE POLICY "Users can delete their own bike images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'bike-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Qualquer pessoa pode visualizar as imagens (público)
CREATE POLICY "Anyone can view bike images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'bike-images');
