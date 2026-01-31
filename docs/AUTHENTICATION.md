# Como Autenticar no RideConnect

## Visão Geral

O RideConnect usa autenticação por email e senha através do Supabase Auth. Quando você não está autenticado, a tela de Perfil mostra automaticamente um painel de login/cadastro.

## Como Fazer Login

### 1. Acesse a Tela de Perfil

- No app, navegue até a aba **"Perfil"** (ícone de usuário no menu inferior)
- Se você não estiver autenticado, verá automaticamente a tela de login

### 2. Tela de Login

A tela mostra:
- Campo de **Email**
- Campo de **Senha**
- Botão **"Entrar"**
- Link **"Não tem uma conta? Criar conta"**

### 3. Preencha os Dados

- Digite seu email
- Digite sua senha (mínimo 6 caracteres)
- Clique em **"Entrar"**

### 4. Após o Login

- Você será automaticamente autenticado
- A tela de Perfil será carregada com seus dados
- Você poderá editar perfil, fazer upload de avatar, etc.

## Como Criar uma Conta

### 1. Na Tela de Login

- Clique em **"Não tem uma conta? Criar conta"**

### 2. Preencha os Dados

- **Nome completo**: Seu nome
- **@username**: Um nome de usuário único (apenas letras minúsculas, números e underscore)
- **Email**: Seu email válido
- **Senha**: Mínimo 6 caracteres

### 3. Criar Conta

- Clique em **"Criar conta"**
- Sua conta será criada e você será automaticamente logado

## Requisitos

- **Email**: Deve ser um email válido
- **Senha**: Mínimo 6 caracteres
- **Username**: 
  - Apenas letras minúsculas (a-z)
  - Números (0-9)
  - Underscore (_)
  - Deve ser único no sistema

## Problemas Comuns

### "Usuário não autenticado"

Se você ver esta mensagem:
1. Certifique-se de que fez login corretamente
2. Verifique se sua sessão não expirou
3. Tente fazer logout e login novamente

### Não consigo criar conta

- Verifique se o email já não está cadastrado
- Verifique se o username já não está em uso
- Certifique-se de que a senha tem pelo menos 6 caracteres

### Esqueci minha senha

Esta funcionalidade ainda não está implementada. Por enquanto, você precisará criar uma nova conta ou entrar em contato com o suporte.

## Logout

Para sair da sua conta:
1. Vá até a tela de Perfil
2. Clique no ícone de engrenagem (⚙️) no canto superior direito
3. Clique em **"Sair da conta"**

## Notas Técnicas

- A autenticação é gerenciada pelo Supabase Auth
- A sessão é mantida no localStorage do navegador
- O perfil do usuário é criado automaticamente quando você se cadastra
- Todas as operações (upload, edição, etc.) requerem autenticação
