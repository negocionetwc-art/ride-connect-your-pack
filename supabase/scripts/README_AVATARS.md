# Como Criar o Bucket de Avatares no Supabase

## Problema
Se você está recebendo o erro **"Bucket not found"** ao tentar fazer upload de avatar, significa que o bucket `avatars` não foi criado no Supabase Storage.

## Solução

### Opção 1: Executar a Migration (Recomendado)
Se você está usando Supabase CLI ou migrations automáticas:

1. Certifique-se de que a migration `20260131160000_avatars_storage.sql` foi executada
2. Execute as migrations pendentes:
   ```bash
   supabase db push
   ```
   ou
   ```bash
   supabase migration up
   ```

### Opção 2: Criar Manualmente via Dashboard

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Storage** no menu lateral
4. Clique em **New bucket**
5. Configure:
   - **Name**: `avatars`
   - **Public bucket**: ✅ (marcado)
6. Clique em **Create bucket**

### Opção 3: Executar SQL Manualmente

1. No Supabase Dashboard, vá em **SQL Editor**
2. Execute o script `create_avatars_bucket.sql` que está em `supabase/scripts/`
3. Ou copie e cole o seguinte SQL:

```sql
-- Criar bucket para avatares
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS
CREATE POLICY IF NOT EXISTS "Users can upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "Users can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "Users can delete their own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "Avatars are publicly readable"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');
```

## Verificação

Após criar o bucket, você pode verificar se está funcionando:

1. No Dashboard, vá em **Storage** → **avatars**
2. O bucket deve aparecer na lista
3. Tente fazer upload de um avatar novamente no app

## Nota Importante

O bucket precisa ser **público** (`public: true`) para que as URLs dos avatares funcionem corretamente. As políticas RLS garantem que apenas o próprio usuário possa fazer upload/atualizar/deletar seus próprios avatares.
