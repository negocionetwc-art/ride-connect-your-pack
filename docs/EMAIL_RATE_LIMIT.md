# Erro: Email Rate Limit Exceeded

## O que é esse erro?

O erro **"email rate limit exceeded"** significa que você excedeu o limite de envios de email do plano gratuito do Supabase.

## Limites do Plano Gratuito do Supabase

- **4 emails por hora** por usuário
- **Total de emails limitado** (varia, mas geralmente ~200-500 por mês)

## Por que aconteceu?

1. Muitos cadastros de teste
2. Muitas tentativas de reenvio de confirmação
3. Limite diário/semanal excedido

## Soluções

### Solução 1: Aguardar (Temporária)

- ⏰ **Aguarde 1 hora** e tente novamente
- O limite é por hora, então após 1h você pode enviar mais emails

### Solução 2: Confirmar Email Manualmente (Imediata)

Se você precisa confirmar o email agora para testar:

1. No Supabase Dashboard: **Authentication** → **Users**
2. Encontre o usuário
3. Clique no usuário
4. Na seção **Email**, você pode:
   - **Marcar como confirmado manualmente** (se disponível)
   - Ou usar a opção de editar o usuário

### Solução 3: Desabilitar Confirmação de Email (Para Desenvolvimento)

Para desenvolvimento/testes, você pode desabilitar a confirmação:

1. Dashboard → **Authentication** → **Settings** → **Email Auth**
2. ❌ **Desmarque** "Enable email confirmations"
3. Agora os cadastros autenticam automaticamente, sem precisar confirmar email

### Solução 4: Configurar SMTP Próprio (Para Produção)

Para produção, configure seu próprio provedor SMTP:

1. Dashboard → **Settings** → **Auth** → **SMTP Settings**
2. Configure com:
   - SendGrid
   - Mailgun
   - AWS SES
   - Outros provedores SMTP

Isso remove os limites do Supabase e você tem controle total.

### Solução 5: Usar Magic Link (Alternativa)

Em vez de senha, use Magic Link:
- Envia link único por email
- Usuário clica e entra automaticamente
- Mas ainda conta no limite de emails

## Como Prevenir

1. **Em desenvolvimento**: Desabilite confirmação de email
2. **Em produção**: Configure SMTP próprio
3. **Testes**: Use poucos emails de teste
4. **Limpe usuários de teste**: Delete usuários antigos no Dashboard

## Verificar Limites

No Dashboard:
- **Authentication** → **Rate Limits**
- Veja seus limites e uso atual

## Status do Usuário

Mesmo com o erro, o usuário foi criado:
- ✅ Conta existe no banco
- ✅ Perfil foi criado
- ❌ Email não foi confirmado ainda

Você pode:
- Aguardar 1h e reenviar
- Confirmar manualmente no Dashboard
- Ou desabilitar confirmação para desenvolvimento
