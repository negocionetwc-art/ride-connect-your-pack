# Como Autenticar no RideConnect

## Visão Geral

O RideConnect usa autenticação por email e senha através do Supabase Auth. O app permite acesso limitado ao FEED sem autenticação, mas requer login para interações.

## Fluxo de Primeiro Acesso

### 1. Visitante (Não Autenticado)

- Ao abrir o app, você cai diretamente no **FEED**
- Pode visualizar posts públicos em modo leitura
- Verá um banner fixo convidando para criar conta ou entrar
- Não pode: curtir, comentar, postar, enviar mensagens, ver stories

### 2. Criar uma Conta

1. Clique em **"Criar conta"** no banner ou navegue para `/auth?mode=signup`
2. Preencha os dados:
   - **Nome completo**: Seu nome
   - **@username**: Nome de usuário único (letras minúsculas, números e underscore)
   - **Email**: Seu email válido
   - **Senha**: Mínimo 6 caracteres

3. Clique em **"Criar conta"**
4. Você verá uma mensagem: **"Enviamos um e-mail para você confirmar sua conta"**
5. Verifique sua caixa de entrada (e pasta de spam)
6. Clique no link de confirmação no email
7. Retorne para a página de login

### 3. Fazer Login

1. Na tela de login (`/auth` ou `/auth?mode=login`)
2. Digite seu email e senha
3. Clique em **"Entrar"**

**Se o email não estiver confirmado:**
- Você verá: "Por favor, confirme seu email antes de fazer login"
- Use a opção para reenviar email de confirmação

### 4. Após o Login

- Você é redirecionado para o FEED
- Acesso completo: curtir, comentar, postar, stories, mensagens, etc.
- Seu perfil e dados são carregados

## Rotas de Autenticação

| Rota | Descrição |
|------|-----------|
| `/` | FEED (público para leitura) |
| `/auth` | Tela de login (padrão) |
| `/auth?mode=login` | Tela de login |
| `/auth?mode=signup` | Tela de cadastro |
| `/auth?mode=forgot-password` | Recuperação de senha |
| `/reset-password` | Redefinir senha (via link do email) |

## Requisitos de Dados

- **Email**: Deve ser um email válido
- **Senha**: Mínimo 6 caracteres
- **Username**: 
  - Mínimo 3 caracteres
  - Apenas letras minúsculas (a-z)
  - Números (0-9)
  - Underscore (_)
  - Deve ser único no sistema

## Problemas Comuns

### "Email não confirmado"

Se você ver esta mensagem:
1. Verifique sua caixa de entrada (incluindo spam)
2. Clique no link de confirmação
3. Se não recebeu, use "Reenviar email de confirmação"

### "Email ou senha incorretos"

- Verifique se digitou corretamente
- Use "Esqueci minha senha" para redefinir

### Não consigo criar conta

- Verifique se o email já não está cadastrado
- Verifique se o username já não está em uso (indicador visual mostra ✓ ou ✗)
- Certifique-se de que a senha tem pelo menos 6 caracteres

### Esqueci minha senha

1. Na tela de login, clique em "Esqueci minha senha"
2. Digite seu email
3. Clique em "Enviar link de recuperação"
4. Verifique seu email (e pasta de spam)
5. Clique no link recebido
6. Defina uma nova senha

## Logout

Para sair da sua conta:
1. Vá até a tela de **Perfil** (ícone de usuário no menu inferior)
2. Clique no ícone de engrenagem (⚙️) no canto superior direito
3. Clique em **"Sair da conta"**

## Navegação e Histórico

- O botão voltar do celular funciona normalmente
- O histórico de navegação é preservado
- Estados de scroll, filtros e abas são mantidos
- Dados carregados são mantidos em cache (evita recarregamento)

## Notas Técnicas

- A autenticação é gerenciada pelo Supabase Auth
- A sessão é mantida no localStorage do navegador
- O perfil do usuário é criado automaticamente quando você se cadastra
- Todas as operações de escrita requerem autenticação
- O FEED pode ser visualizado sem login (modo leitura)
