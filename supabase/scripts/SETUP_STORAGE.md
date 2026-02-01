# Configuração Manual do Storage Bucket `group-covers`

## Problema
O erro "Erro ao fazer upload da imagem" ocorre porque o bucket `group-covers` não existe no Supabase Storage.

## Solução 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para o seu projeto: `qrvwebwwzjwqomgfeydt`
3. No menu lateral, clique em **Storage**
4. Clique em **"Create a new bucket"**
5. Configure o bucket com os seguintes parâmetros:

```
Name: group-covers
Public bucket: ✅ YES
File size limit: 5 MB (5242880 bytes)
Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
```

6. Após criar, vá para **Policies** e adicione as seguintes policies:

### Policy 1: Public Read
- **Policy Name**: Group covers are publicly accessible
- **Target Roles**: public
- **Operation**: SELECT
- **WITH CHECK expression**: `bucket_id = 'group-covers'`

### Policy 2: Authenticated Upload
- **Policy Name**: Authenticated users can upload group covers
- **Target Roles**: authenticated
- **Operation**: INSERT
- **WITH CHECK expression**: `bucket_id = 'group-covers'`

### Policy 3: Owner Update
- **Policy Name**: Users can update their own group covers
- **Target Roles**: authenticated
- **Operation**: UPDATE
- **USING expression**: `bucket_id = 'group-covers' AND auth.uid()::text = (storage.foldername(name))[1]`

### Policy 4: Owner Delete
- **Policy Name**: Users can delete their own group covers
- **Target Roles**: authenticated
- **Operation**: DELETE
- **USING expression**: `bucket_id = 'group-covers' AND auth.uid()::text = (storage.foldername(name))[1]`

## Solução 2: Via SQL Editor

1. Acesse o SQL Editor no Supabase Dashboard
2. Execute o script `setup-group-covers-bucket.sql` localizado em `supabase/scripts/`
3. Verifique se o bucket foi criado corretamente

## Solução 3: Via Migration

A migration `20260201000000_unique_group_names.sql` já contém o código para criar o bucket automaticamente. Execute:

```bash
supabase db push
```

Ou aplique a migration manualmente no SQL Editor.

## Verificação

Após configurar, teste criando um grupo com imagem de capa. O upload deve funcionar sem erros.

## Estrutura de Arquivos

Os arquivos serão salvos seguindo o padrão:
```
group-covers/{user_id}/{timestamp}.{ext}
```

Exemplo:
```
group-covers/123e4567-e89b-12d3-a456-426614174000/1706745600000.jpg
```

## Troubleshooting

### Erro: "new row violates row-level security policy"
- Verifique se as policies foram criadas corretamente
- Certifique-se de que o usuário está autenticado

### Erro: "Bucket not found"
- O bucket não foi criado. Use a Solução 1 (Dashboard)

### Erro: "File size too large"
- O arquivo excede 5MB. Redimensione a imagem antes do upload
