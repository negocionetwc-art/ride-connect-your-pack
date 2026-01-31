# Login/Cadastro com Google (Supabase OAuth)

## 1) Configurar no Supabase Dashboard

1. Abra o Supabase Dashboard do seu projeto
2. Vá em **Authentication → Providers**
3. Ative **Google**
4. Informe:
   - **Client ID**
   - **Client Secret**
5. Em **Authentication → URL Configuration** (ou equivalente), configure:
   - **Site URL**: sua URL principal (ex.: `http://localhost:5173` ou sua URL de produção)
   - **Redirect URLs**: inclua pelo menos:
     - `http://localhost:5173/**`
     - sua URL de produção `https://SEU_DOMINIO/**`

## 2) Configurar no Google Cloud Console

1. Abra o Google Cloud Console e selecione/crie um projeto
2. Vá em **APIs & Services → Credentials**
3. Crie um **OAuth Client ID** do tipo **Web application**
4. Em **Authorized redirect URIs**, adicione:
   - `https://<SEU_PROJECT_REF>.supabase.co/auth/v1/callback`
     - Ex.: `https://qrvwebwwzjwqomgfeydt.supabase.co/auth/v1/callback`
5. Copie o **Client ID** e o **Client Secret** e cole no Supabase (passo 1)

## 3) No app (já implementado)

- **Perfil**: `src/components/profile/AuthPanel.tsx` tem botão **Continuar com Google**
- **Página /auth**: `src/pages/Auth.tsx` também tem botão **Continuar com Google**
- O fluxo usa `supabase.auth.signInWithOAuth({ provider: 'google' })`

## 4) Observações

- Usuários do Google normalmente já entram **confirmados**, então evita problemas de “email not confirmed”.
- O perfil é criado via trigger do banco (`handle_new_user`). Existe uma migration para preencher `name`/`avatar_url` com os campos comuns do Google (`name`/`picture`).

