# Como Verificar se o Email está Sendo Enviado no Cadastro

## Verificação no Código

O código agora inclui logs detalhados no console do navegador. Para verificar:

1. Abra o **Console do Desenvolvedor** (F12 ou Ctrl+Shift+I)
2. Vá na aba **Console**
3. Faça um novo cadastro
4. Procure por estas mensagens:

```
📧 Iniciando cadastro para: seu@email.com
🔗 URL de redirecionamento: http://localhost:5173/
✅ SignUp realizado com sucesso
👤 Usuário criado: [UUID]
📧 Email confirmado? Não
🔐 Sessão criada? Não
📧 Email de confirmação DEVERIA ter sido enviado
```

## O que os logs indicam:

### Se você vê "Sessão criada? Não":
- ✅ O Supabase tentou enviar o email
- ⚠️ Mas o email pode não ter chegado por:
  - Configuração no Dashboard
  - Email na pasta de spam
  - Limites do plano gratuito

### Se você vê "Sessão criada? Sim":
- ❌ Confirmação de email está **DESABILITADA** no Dashboard
- ✅ Usuário é autenticado automaticamente
- 📧 Email **NÃO** é enviado (porque não precisa)

## Verificação no Supabase Dashboard

### 1. Verificar se o usuário foi criado:

1. Acesse: https://supabase.com/dashboard
2. Vá em **Authentication** → **Users**
3. Procure pelo email cadastrado
4. Verifique:
   - **Email confirmed**: Se está `false`, o email não foi confirmado ainda
   - **Created at**: Data/hora do cadastro

### 2. Verificar configurações de email:

1. **Authentication** → **Settings** → **Email Auth**
2. Verifique:
   - ✅ **Enable email confirmations**: Deve estar marcado para enviar emails
   - **Site URL**: Deve estar configurado
   - **Redirect URLs**: Deve incluir sua URL (ex: `http://localhost:5173/**`)

### 3. Verificar logs de email (se disponível):

1. **Authentication** → **Logs**
2. Procure por eventos de "signup" ou "email"
3. Veja se há erros relacionados a envio de email

## Teste Prático

### Teste 1: Verificar se email chega

1. Faça um cadastro com um email real
2. Aguarde 1-2 minutos
3. Verifique:
   - Caixa de entrada
   - Pasta de spam
   - Email vem de: `noreply@mail.app.supabase.io`

### Teste 2: Verificar no Dashboard

1. Após cadastro, vá no Dashboard
2. **Authentication** → **Users**
3. Encontre o usuário
4. Clique no usuário
5. Veja o status:
   - **Unconfirmed** = Email não confirmado (email pode ter sido enviado)
   - **Confirmed** = Email confirmado

### Teste 3: Reenviar email

1. No Dashboard: **Authentication** → **Users**
2. Selecione o usuário não confirmado
3. Clique em **"Send confirmation email"** ou **"Resend confirmation"**
4. Verifique se o email chega

## Possíveis Problemas

### Email não está sendo enviado:

1. **Confirmação desabilitada**: 
   - Dashboard → Authentication → Settings
   - Desmarque "Enable email confirmations" para testar sem email
   - Ou marque para habilitar envio

2. **Site URL não configurado**:
   - Configure em Authentication → Settings → Site URL

3. **Limites do plano**:
   - Plano gratuito tem limites de email
   - Verifique se não excedeu o limite

4. **Email provider**:
   - Por padrão usa serviço do Supabase
   - Para produção, configure SMTP próprio

## Solução Rápida para Desenvolvimento

Se você só quer testar sem email:

1. Dashboard → **Authentication** → **Settings** → **Email Auth**
2. ❌ **Desmarque** "Enable email confirmations"
3. Agora o cadastro autentica automaticamente, sem precisar confirmar email

## Solução para Produção

Para garantir que emails sejam enviados:

1. ✅ Habilite "Enable email confirmations"
2. ✅ Configure Site URL corretamente
3. ✅ Configure SMTP próprio (recomendado)
4. ✅ Personalize templates de email
