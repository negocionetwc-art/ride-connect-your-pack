-- Execute este script no SQL Editor do Supabase Dashboard
-- Ele deve funcionar porque o Dashboard tem permissões elevadas

-- 1. Adicionar constraint UNIQUE nos nomes de grupos
ALTER TABLE public.groups 
ADD CONSTRAINT groups_name_unique UNIQUE (name);

-- 2. Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_groups_name_lower 
ON public.groups (LOWER(name));

-- 3. Tentar criar bucket (pode funcionar no Dashboard)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'group-covers',
  'group-covers',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 4. Criar policies de storage
CREATE POLICY IF NOT EXISTS "Group covers are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'group-covers');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload group covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'group-covers');

CREATE POLICY IF NOT EXISTS "Users can update their own group covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'group-covers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can delete their own group covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'group-covers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Verificar se funcionou
SELECT * FROM storage.buckets WHERE id = 'group-covers';
