# Sistema Administrativo - RideConnect

## Visão Geral

Este documento descreve o sistema administrativo implementado no RideConnect, que permite gerenciamento completo do aplicativo através de uma interface web protegida por roles.

## Arquitetura

### 1. Políticas RLS (Row Level Security)

**Arquivo**: `supabase/migrations/20260131150000_admin_rls_policies.sql`

As políticas RLS administrativas permitem que usuários com role `admin` tenham acesso total a todas as tabelas do banco de dados:

- **profiles**: UPDATE/DELETE de qualquer perfil
- **posts**: UPDATE/DELETE de qualquer post
- **post_comments**: UPDATE/DELETE de qualquer comentário
- **post_likes**: DELETE de qualquer like
- **stories**: Ver todas (incluindo expiradas) e DELETE de qualquer story
- **story_views**: Ver todas as visualizações
- **groups**: UPDATE/DELETE de qualquer grupo
- **group_memberships**: Gerenciar membros de qualquer grupo
- **user_locations**: Ver todas as localizações (online e offline)
- **user_roles**: INSERT/UPDATE/DELETE de roles
- **user_badges**: INSERT/UPDATE/DELETE de badges de usuários
- **badges**: Gerenciar badges do sistema
- **user_follows**: Gerenciar relacionamentos de follow

### 2. Hook useAdmin

**Arquivo**: `src/hooks/useAdmin.tsx`

Hook React que verifica se o usuário atual possui role de admin:

```typescript
const { isAdmin, isLoading, user } = useAdmin();
```

**Retorna**:
- `isAdmin`: boolean - Se o usuário é admin
- `isLoading`: boolean - Estado de carregamento
- `user`: User | null - Objeto do usuário autenticado

### 3. Página de Admin

**Arquivo**: `src/pages/Admin.tsx`

Página protegida que redireciona usuários não-admin para a página inicial. Acessível em `/admin`.

**Componentes**:
- `StatsOverview`: Estatísticas gerais do app
- `UsersManagement`: Gerenciamento de usuários e roles
- `PostsManagement`: Moderação de posts
- `GroupsManagement`: Gerenciamento de grupos

### 4. Componentes Administrativos

#### StatsOverview
**Arquivo**: `src/components/admin/StatsOverview.tsx`

Exibe estatísticas em tempo real:
- Total de usuários
- Total de posts
- Total de grupos
- Usuários online

#### UsersManagement
**Arquivo**: `src/components/admin/UsersManagement.tsx`

Funcionalidades:
- Listar todos os usuários
- Buscar usuários por nome ou username
- Visualizar roles de cada usuário
- Atribuir/remover roles de admin e moderador
- Ver informações do perfil (KM total, nível)

#### PostsManagement
**Arquivo**: `src/components/admin/PostsManagement.tsx`

Funcionalidades:
- Listar todos os posts
- Buscar posts por conteúdo ou autor
- Visualizar estatísticas (likes, comentários)
- Deletar posts
- Ver imagens dos posts

#### GroupsManagement
**Arquivo**: `src/components/admin/GroupsManagement.tsx`

Funcionalidades:
- Listar todos os grupos
- Buscar grupos por nome, descrição ou dono
- Ver informações do grupo (membros, categoria)
- Deletar grupos

## Como Usar

### 1. Atribuir Role de Admin

**Método 1: Via Supabase Dashboard (Recomendado)**

1. Acesse https://supabase.com/dashboard
2. Navegue até seu projeto
3. Vá em **Authentication > Users**
4. Encontre seu usuário e copie o UUID
5. Vá em **SQL Editor**
6. Execute o script em `supabase/scripts/assign_admin_role.sql`
7. Substitua `'SEU_USER_ID_AQUI'` pelo seu UUID

**Método 2: Via SQL direto**

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('SEU_USER_ID_AQUI', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

### 2. Acessar o Painel Admin

1. Faça login no aplicativo
2. Navegue para `/admin`
3. Se você tiver role de admin, verá o painel administrativo
4. Se não tiver, será redirecionado para a página inicial

### 3. Aplicar Migration das Políticas RLS

As políticas RLS administrativas precisam ser aplicadas no Supabase:

1. Acesse o Supabase Dashboard
2. Vá em **Database > Migrations**
3. A migration `20260131150000_admin_rls_policies.sql` deve ser aplicada automaticamente
4. Se não, execute manualmente no SQL Editor

## Estrutura de Arquivos

```
src/
├── hooks/
│   └── useAdmin.tsx                    # Hook para verificar role de admin
├── pages/
│   └── Admin.tsx                      # Página principal do admin
└── components/
    └── admin/
        ├── StatsOverview.tsx         # Estatísticas gerais
        ├── UsersManagement.tsx         # Gerenciamento de usuários
        ├── PostsManagement.tsx         # Gerenciamento de posts
        └── GroupsManagement.tsx        # Gerenciamento de grupos

supabase/
├── migrations/
│   └── 20260131150000_admin_rls_policies.sql  # Políticas RLS administrativas
└── scripts/
    └── assign_admin_role.sql          # Script para atribuir role de admin
```

## Segurança

### Políticas RLS

Todas as políticas administrativas verificam a role usando a função `has_role()`:

```sql
USING (public.has_role(auth.uid(), 'admin'))
```

Isso garante que apenas usuários com role `admin` possam:
- Ver dados privados
- Modificar dados de outros usuários
- Gerenciar roles e permissões

### Proteção de Rotas

A página `/admin` é protegida no frontend:
- Verifica se o usuário está autenticado
- Verifica se o usuário tem role de admin
- Redireciona para `/` se não tiver permissão

### Boas Práticas

1. **Nunca exponha o service_role key** no frontend
2. **Use sempre as políticas RLS** - não confie apenas na proteção do frontend
3. **Monitore logs** de ações administrativas (futuro)
4. **Limite o número de admins** - apenas desenvolvedores e moderadores confiáveis

## Funcionalidades Futuras

- [ ] Logs de ações administrativas
- [ ] Histórico de modificações
- [ ] Notificações para usuários quando posts são deletados
- [ ] Estatísticas avançadas (gráficos, relatórios)
- [ ] Gerenciamento de badges
- [ ] Moderação de comentários
- [ ] Sistema de denúncias
- [ ] Exportação de dados

## Troubleshooting

### "Você não tem permissão para acessar esta página"

**Causa**: Usuário não tem role de admin

**Solução**:
1. Verifique se a role foi atribuída corretamente
2. Execute: `SELECT * FROM user_roles WHERE user_id = 'SEU_UUID' AND role = 'admin'`
3. Se não retornar nada, atribua a role novamente

### "Erro ao carregar dados"

**Causa**: Políticas RLS não foram aplicadas

**Solução**:
1. Verifique se a migration foi aplicada
2. Execute manualmente no SQL Editor se necessário
3. Verifique se você tem role de admin

### "Não consigo deletar/modificar dados"

**Causa**: Políticas RLS administrativas não estão funcionando

**Solução**:
1. Verifique se a migration `20260131150000_admin_rls_policies.sql` foi aplicada
2. Verifique se você tem role de admin
3. Verifique os logs do Supabase para erros de RLS

## Contato e Suporte

Para questões sobre o sistema administrativo, consulte:
- Documentação do Supabase: https://supabase.com/docs
- Documentação do React Router: https://reactrouter.com
