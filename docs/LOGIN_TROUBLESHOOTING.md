# Troubleshooting: Erro de Login

## Erro: "Invalid login credentials" ou "Email ou senha incorretos"

Este erro pode ter várias causas. Siga este guia para identificar e resolver o problema.

## Possíveis Causas

### 1. Email ou Senha Incorretos (Mais Comum)

**Sintomas:**
- Mensagem: "Invalid login credentials" ou "Email ou senha incorretos"
- Você tem certeza que digitou corretamente

**Soluções:**
- ✅ Verifique se o email está correto (sem espaços, letras maiúsculas/minúsculas)
- ✅ Verifique se a senha está correta (case-sensitive)
- ✅ Tente copiar e colar o email para evitar erros de digitação
- ✅ Use "Esqueci minha senha" para redefinir a senha

### 2. Email Não Confirmado

**Sintomas:**
- Você se cadastrou mas não confirmou o email
- Mensagem pode ser: "Email not confirmed" ou "Invalid login credentials"

**Soluções:**
- ✅ Verifique sua caixa de entrada (e pasta de spam)
- ✅ Procure por email de `noreply@mail.app.supabase.io`
- ✅ Use o botão "Reenviar email de confirmação" no formulário
- ✅ Se não receber, verifique se confirmação de email está habilitada no Supabase Dashboard

**Como verificar no Supabase:**
1. Vá em **Authentication → Settings**
2. Verifique se "Confirm email" está marcado
3. Se estiver desabilitado, você pode fazer login sem confirmar

### 3. Usuário Não Existe

**Sintomas:**
- Você tentou fazer login mas nunca se cadastrou
- Mensagem: "User not found" ou "Invalid login credentials"

**Soluções:**
- ✅ Crie uma conta primeiro usando "Criar conta"
- ✅ Verifique se você está usando o email correto

### 4. Problema com Confirmação de Email

**Se você se cadastrou mas não recebeu o email:**

1. **Verifique a pasta de spam**
   - Gmail: Pasta "Spam" ou "Lixo eletrônico"
   - Outlook: Pasta "Lixo eletrônico"
   - Outros: Verifique filtros de spam

2. **Adicione o remetente aos contatos**
   - Email: `noreply@mail.app.supabase.io`
   - Isso evita que emails futuros vão para spam

3. **Verifique rate limit**
   - Supabase free tem limite de ~4 emails/hora
   - Se excedeu, aguarde 1 hora ou desabilite confirmação de email

4. **Reenvie o email de confirmação**
   - Use o botão "Reenviar email de confirmação" no formulário de login
   - Aparece quando você tenta fazer login com email não confirmado

### 5. Problema com Configuração do Supabase

**Verifique no Supabase Dashboard:**

1. **Authentication → Settings → Email Auth**
   - Deve estar habilitado
   - "Confirm email" pode estar habilitado ou não

2. **Authentication → URL Configuration**
   - **Site URL**: Deve ser sua URL (ex: `http://localhost:5173`)
   - **Redirect URLs**: Deve incluir `http://localhost:5173/**`

3. **Authentication → Logs**
   - Veja tentativas de login e erros específicos
   - Isso ajuda a identificar o problema exato

## Como Verificar se o Usuário Existe

### No Supabase Dashboard:

1. Vá em **Authentication → Users**
2. Procure pelo email que você está tentando usar
3. Se não encontrar, você precisa criar uma conta primeiro

### Verificar Status do Email:

1. Encontre seu usuário em **Authentication → Users**
2. Veja a coluna **Email Confirmed**
3. Se estiver como "No", você precisa confirmar o email

## Soluções Rápidas

### Para Desenvolvimento (Desabilitar Confirmação de Email):

1. Supabase Dashboard → **Authentication → Settings**
2. Desmarque **"Confirm email"**
3. Agora você pode fazer login imediatamente após cadastro

### Para Produção (Habilitar Confirmação de Email):

1. Supabase Dashboard → **Authentication → Settings**
2. Marque **"Confirm email"**
3. Configure SMTP próprio para melhor entrega de emails

## Teste Passo a Passo

1. ✅ **Verifique se você tem uma conta**
   - Tente criar uma nova conta com o mesmo email
   - Se der erro "already registered", a conta existe

2. ✅ **Verifique o email**
   - Use exatamente o mesmo email do cadastro
   - Verifique maiúsculas/minúsculas
   - Remova espaços extras

3. ✅ **Verifique a senha**
   - A senha é case-sensitive
   - Verifique se não há espaços no início/fim
   - Tente redefinir a senha se necessário

4. ✅ **Verifique confirmação de email**
   - Veja se o email foi confirmado no Dashboard
   - Se não, reenvie o email de confirmação

5. ✅ **Verifique logs**
   - Supabase Dashboard → **Authentication → Logs**
   - Veja o erro específico que está ocorrendo

## Mensagens de Erro Comuns

| Mensagem | Causa | Solução |
|----------|-------|---------|
| "Invalid login credentials" | Email/senha incorretos ou email não confirmado | Verifique credenciais ou confirme email |
| "Email not confirmed" | Email não foi confirmado | Reenvie email de confirmação |
| "User not found" | Usuário não existe | Crie uma conta primeiro |
| "Too many requests" | Rate limit excedido | Aguarde alguns minutos |

## Ainda com Problemas?

1. **Verifique os logs no console do navegador** (F12)
   - Veja mensagens de erro detalhadas
   - Procure por logs que começam com 🔐, ❌, ✅

2. **Verifique os logs no Supabase Dashboard**
   - Authentication → Logs
   - Veja tentativas de login e erros

3. **Teste com outro email**
   - Crie uma nova conta com outro email
   - Veja se o problema persiste

4. **Verifique a configuração do projeto**
   - Supabase Dashboard → Settings
   - Verifique se tudo está configurado corretamente
