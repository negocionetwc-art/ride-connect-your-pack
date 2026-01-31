# Fluxo de Cadastro e Confirmação de Email

## Visão Geral

Este documento explica o fluxo completo de cadastro de usuários no RideConnect, incluindo validações, criação de perfil e envio de email de confirmação.

## Fluxo de Cadastro

### 1. Validação no Frontend

Antes de criar o usuário, o sistema valida:

- **Username**: Verifica se já existe no banco de dados
- **Formato**: Apenas letras minúsculas, números e underscore (`_`)
- **Tamanho mínimo**: 3 caracteres
- **Email**: Formato válido
- **Senha**: Mínimo de 6 caracteres

### 2. Criação do Usuário

Quando o usuário submete o formulário:

1. **Validação prévia**: O sistema verifica se o username está disponível
2. **Criação no Supabase Auth**: `supabase.auth.signUp()` cria o usuário em `auth.users`
3. **Trigger automático**: O trigger `handle_new_user()` cria o perfil em `profiles`
4. **Envio de email**: Se confirmação de email estiver habilitada, o Supabase envia o email

### 3. Criação do Perfil

O trigger `handle_new_user()` executa automaticamente após a criação do usuário:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Piloto'),
    COALESCE(NEW.raw_user_meta_data->>'username', 'rider_' || substr(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**Importante**: Se o username já existir, o trigger falha e o cadastro é revertido.

## Validação em Tempo Real

O sistema verifica a disponibilidade do username enquanto o usuário digita:

- **Debounce**: Aguarda 500ms após parar de digitar
- **Indicadores visuais**:
  - 🔄 Verificando... (checking)
  - ✓ Disponível (available)
  - ✗ Já está em uso (taken)

## Problemas Comuns e Soluções

### 1. Erro: "Database error saving new user"

**Causa**: Username duplicado ou outro erro no trigger `handle_new_user()`.

**Solução**:
- O sistema agora valida o username **antes** de criar o usuário
- Se o username já existir, mostra erro claro: "Username já está em uso"
- Escolha outro username

### 2. Email de confirmação não chega

**Possíveis causas**:

#### a) Rate Limit do Supabase (Plano Free)
- **Limite**: ~4 emails por hora por usuário
- **Solução**: Aguarde 1 hora ou configure SMTP próprio

#### b) Email na pasta de spam
- Verifique a pasta de spam/lixo eletrônico
- Adicione `noreply@mail.app.supabase.io` aos contatos

#### c) Confirmação de email desabilitada
- **Verificar**: Supabase Dashboard → Authentication → Settings → "Confirm email"
- Se desabilitado, login é imediato (sem confirmação)

#### d) URL de redirecionamento incorreta
- **Verificar**: Supabase Dashboard → Authentication → URL Configuration
- **Site URL**: Deve ser sua URL (ex: `http://localhost:5173` ou `https://seudominio.com`)
- **Redirect URLs**: Deve incluir `http://localhost:5173/**` e sua URL de produção

### 3. Username já está em uso

**Solução**: Escolha outro username. O sistema mostra em tempo real se está disponível.

### 4. Email já cadastrado

**Solução**: Use outro email ou faça login com a conta existente.

## Verificação de Logs

Para debugar problemas, verifique os logs no Supabase Dashboard:

1. **Authentication → Logs**: Veja tentativas de cadastro e erros
2. **Database → Logs**: Veja erros do trigger `handle_new_user()`
3. **Console do navegador**: Veja logs detalhados do frontend

## Configuração Recomendada

### Para Desenvolvimento

1. **Desabilitar confirmação de email**:
   - Supabase Dashboard → Authentication → Settings
   - Desmarque "Confirm email"
   - Login será imediato após cadastro

### Para Produção

1. **Habilitar confirmação de email**:
   - Supabase Dashboard → Authentication → Settings
   - Marque "Confirm email"

2. **Configurar SMTP próprio** (recomendado):
   - Supabase Dashboard → Settings → Auth → SMTP Settings
   - Configure SendGrid, Mailgun, AWS SES, etc.
   - Remove limitações do plano free

3. **Configurar URLs**:
   - **Site URL**: URL de produção
   - **Redirect URLs**: Inclua todas as URLs permitidas

## Fluxo de Email de Confirmação

1. Usuário se cadastra
2. Supabase cria usuário em `auth.users`
3. Trigger `handle_new_user()` cria perfil em `profiles`
4. Se tudo OK, Supabase envia email de confirmação
5. Usuário clica no link do email
6. Supabase redireciona para `emailRedirectTo`
7. Usuário é autenticado automaticamente

## Validações Implementadas

### Frontend (Antes do Cadastro)

- ✅ Username disponível
- ✅ Formato do username válido
- ✅ Email válido
- ✅ Senha com mínimo de 6 caracteres
- ✅ Nome preenchido

### Backend (Trigger)

- ✅ Username único (constraint UNIQUE)
- ✅ Perfil criado automaticamente
- ✅ Valores padrão se metadata não fornecida

## Troubleshooting Rápido

| Problema | Verificar |
|----------|-----------|
| Email não chega | Rate limit, spam, confirmação habilitada? |
| Username duplicado | Validação em tempo real mostra status |
| Erro no cadastro | Ver logs no Dashboard |
| Login não funciona | Email confirmado? Verificar `email_confirmed_at` |

## Contato

Se o problema persistir, verifique:
- Logs no Supabase Dashboard
- Console do navegador (F12)
- Documentação do Supabase: https://supabase.com/docs/guides/auth
