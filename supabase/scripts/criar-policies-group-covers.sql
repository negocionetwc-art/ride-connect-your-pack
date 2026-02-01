-- Execute este SQL para criar as 4 policies do bucket group-covers
-- Cole no SQL Editor do Supabase e clique em RUN

-- Policy 1: Public Read (Ver imagens)
CREATE POLICY IF NOT EXISTS "Group covers are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'group-covers');

-- Policy 2: Authenticated Upload (Fazer upload)
CREATE POLICY IF NOT EXISTS "Authenticated users can upload group covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'group-covers');

-- Policy 3: Owner Update (Atualizar próprias imagens)
CREATE POLICY IF NOT EXISTS "Users can update their own group covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'group-covers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Owner Delete (Deletar próprias imagens)
CREATE POLICY IF NOT EXISTS "Users can delete their own group covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'group-covers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Verificar se as policies foram criadas
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%group cover%';
