# Configuração de Confirmação de Email no Supabase

## Problema
O email de confirmação não está sendo enviado após o cadastro.

## Soluções

### Opção 1: Verificar Configurações no Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Authentication** → **Settings** → **Email Auth**
4. Verifique as seguintes configurações:

#### Se você QUER confirmação de email:
- ✅ **Enable email confirmations**: Deve estar marcado
- **Confirm email**: Deve estar habilitado
- **Site URL**: Deve estar configurado (ex: `http://localhost:5173` para dev ou sua URL de produção)

#### Se você NÃO quer confirmação de email (para desenvolvimento):
- ❌ **Enable email confirmations**: Desmarque
- Isso permite login imediato após cadastro

### Opção 2: Configurar Templates de Email

1. No Dashboard, vá em **Authentication** → **Email Templates**
2. Verifique se os templates estão configurados:
   - **Confirm signup**: Template para confirmação de cadastro
   - **Magic Link**: Template para links mágicos (se usar)

### Opção 3: Verificar Email Provider

1. No Dashboard, vá em **Settings** → **Auth** → **SMTP Settings**
2. Por padrão, o Supabase usa seu próprio serviço de email
3. Para produção, recomenda-se configurar um provedor SMTP próprio:
   - SendGrid
   - Mailgun
   - AWS SES
   - etc.

### Opção 4: Verificar Spam/Lixo Eletrônico

- O email pode estar indo para a pasta de spam
- Verifique também a caixa de entrada
- O email vem de: `noreply@mail.app.supabase.io` (padrão)

## Configuração Atual do Código

O código já está configurado para:
- ✅ Enviar `emailRedirectTo` no signUp
- ✅ Detectar se email precisa ser confirmado
- ✅ Mostrar mensagem apropriada ao usuário

## Para Desenvolvimento Local

Se você está em desenvolvimento e não quer confirmação de email:

1. No Supabase Dashboard:
   - **Authentication** → **Settings** → **Email Auth**
   - Desmarque **"Enable email confirmations"**

2. Isso permitirá login imediato após cadastro, sem precisar confirmar email.

## Para Produção

Recomenda-se:
1. ✅ Habilitar confirmação de email
2. ✅ Configurar SMTP próprio
3. ✅ Personalizar templates de email
4. ✅ Configurar Site URL corretamente

## Verificar se Email foi Enviado

No Supabase Dashboard:
1. Vá em **Authentication** → **Users**
2. Encontre o usuário recém-criado
3. Verifique o status:
   - **Confirmed**: Email foi confirmado
   - **Unconfirmed**: Email ainda não foi confirmado

## Reenviar Email de Confirmação

Você pode reenviar o email de confirmação:
1. No Dashboard: **Authentication** → **Users** → Selecione o usuário → **Send confirmation email**
2. Ou via código (funcionalidade pode ser adicionada ao app)

## Notas Importantes

- Em desenvolvimento local, emails podem não funcionar corretamente
- O Supabase tem limites de email no plano gratuito
- Para produção, configure SMTP próprio para melhor deliverability
