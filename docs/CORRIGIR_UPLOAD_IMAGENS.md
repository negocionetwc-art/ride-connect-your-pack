# 🔧 Como Resolver o Erro de Upload de Imagens

## ❌ Problema Identificado

O erro "Erro ao fazer upload da imagem" ocorre porque o **bucket `group-covers` não existe** no Supabase Storage.

## ✅ Solução Rápida (3 minutos)

### Passo 1: Acesse o Supabase Dashboard

1. Vá para: https://supabase.com/dashboard/project/qrvwebwwzjwqomgfeydt
2. Faça login se necessário

### Passo 2: Crie o Bucket

1. No menu lateral esquerdo, clique em **"Storage"** (ícone de pasta)
2. Clique no botão **"Create a new bucket"** (botão verde)
3. Preencha os campos:

```
Name: group-covers
Public bucket: ✅ MARQUE ESTA OPÇÃO
File size limit: 5242880  (ou digite "5" e selecione "MB")
Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
```

4. Clique em **"Create bucket"**

### Passo 3: Configure as Policies (Permissões)

Após criar o bucket, você precisa adicionar policies para permitir upload:

1. Clique no bucket **"group-covers"** que você acabou de criar
2. Clique na aba **"Policies"**
3. Clique em **"New Policy"**

#### Policy 1: Public Read (Ver imagens)
```
Policy Name: Group covers are publicly accessible
Target Roles: public
Operation: SELECT
Policy definition: (bucket_id = 'group-covers')
```

#### Policy 2: Authenticated Upload (Fazer upload)
```
Policy Name: Authenticated users can upload group covers
Target Roles: authenticated  
Operation: INSERT
WITH CHECK expression: (bucket_id = 'group-covers')
```

#### Policy 3: Owner Update (Atualizar próprias imagens)
```
Policy Name: Users can update their own group covers
Target Roles: authenticated
Operation: UPDATE
USING expression: (bucket_id = 'group-covers' AND auth.uid()::text = (storage.foldername(name))[1])
```

#### Policy 4: Owner Delete (Deletar próprias imagens)
```
Policy Name: Users can delete their own group covers
Target Roles: authenticated
Operation: DELETE
USING expression: (bucket_id = 'group-covers' AND auth.uid()::text = (storage.foldername(name))[1])
```

### Passo 4: Aplicar a Migration (Opcional)

Se você preferir fazer via SQL:

1. No Supabase Dashboard, vá em **SQL Editor**
2. Cole o conteúdo do arquivo `supabase/migrations/20260201000000_unique_group_names.sql`
3. Clique em **"Run"**

Ou via linha de comando:
```bash
supabase db push
```

## 🎉 Pronto! Agora teste

1. Volte para a aplicação
2. Tente criar um grupo com uma imagem
3. Deve funcionar perfeitamente agora!

## 🛡️ Validações Implementadas

Após esta atualização, o sistema agora:

### ✅ Validação de Nomes Únicos
- ❌ **Não permite** grupos com nomes duplicados
- 🔍 Verifica em tempo real se o nome já existe
- ✓ Mostra feedback visual: "Nome disponível" ou "Nome já em uso"

### ✅ Validação de Upload
- 📏 Tamanho máximo: **5MB**
- 🖼️ Formatos aceitos: **JPG, PNG, WEBP, GIF**
- 🚫 Mensagens de erro específicas para cada problema
- 🧹 Limpeza automática em caso de falha

### ✅ Melhorias de UX
- ⏳ Indicador de "Verificando disponibilidade..."
- 🎨 Feedback colorido (verde = ok, vermelho = erro)
- 🔒 Botão desabilitado quando nome já existe ou está verificando
- 📝 Validação de 3-50 caracteres para o nome

## 📋 Checklist de Verificação

Antes de testar, confirme:

- [ ] Bucket `group-covers` criado
- [ ] Bucket marcado como **público**
- [ ] 4 policies configuradas
- [ ] Limite de 5MB configurado
- [ ] MIME types configurados

## 🐛 Troubleshooting

### "Bucket not found"
➡️ O bucket não foi criado. Repita o Passo 2.

### "new row violates row-level security policy"
➡️ As policies não foram criadas. Repita o Passo 3.

### "File size too large"
➡️ A imagem é maior que 5MB. Redimensione antes de fazer upload.

### "Nome já em uso"
➡️ Funciona corretamente! Escolha outro nome para o grupo.

## 📞 Suporte

Se ainda tiver problemas, verifique:
1. Console do navegador (F12) para ver erros detalhados
2. Logs do Supabase Dashboard em "Logs" > "API"
3. Certifique-se de estar autenticado na aplicação
