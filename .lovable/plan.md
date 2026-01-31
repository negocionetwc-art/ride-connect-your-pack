
# Plano de Criacao do Banco de Dados RideConnect

Este plano cria toda a estrutura de banco de dados necessaria para o aplicativo RideConnect, uma rede social para motociclistas.

---

## Resumo das Tabelas

O banco de dados tera **12 tabelas principais** que suportam todas as funcionalidades do app:

| Tabela | Descricao |
|--------|-----------|
| profiles | Perfis dos usuarios (nome, username, moto, nivel, km) |
| posts | Publicacoes com fotos das viagens |
| post_likes | Curtidas nos posts |
| post_comments | Comentarios nos posts |
| stories | Stories temporarios (24h) |
| story_views | Visualizacoes dos stories |
| groups | Grupos/comunidades de motociclistas |
| group_memberships | Membros dos grupos |
| badges | Conquistas disponiveis no app |
| user_badges | Conquistas desbloqueadas por usuario |
| user_locations | Localizacao em tempo real (mapa ao vivo) |
| user_follows | Sistema de seguidores |
| user_roles | Papeis de usuario (admin, moderator, user) |

---

## Diagrama de Relacionamentos

```text
                        +----------------+
                        |   auth.users   |
                        +-------+--------+
                                |
                                | 1:1
                                v
+----------------+      +-------+--------+      +----------------+
|    badges      |<---->|    profiles    |<---->|   user_roles   |
+----------------+      +-------+--------+      +----------------+
        ^                       |
        |                       |
+-------+--------+              | 1:N
|  user_badges   |              |
+----------------+      +-------+--------+
                        |                |
                   +----+----+      +----+----+
                   |  posts  |      | stories |
                   +----+----+      +----+----+
                        |                |
              +---------+---------+      |
              |                   |      |
         +----+----+         +----+----+ +----+----+
         | likes   |         |comments | |  views  |
         +---------+         +---------+ +---------+

+----------------+      +----------------+      +----------------+
|    groups      |<---->| group_members  |<---->|    profiles    |
+----------------+      +----------------+      +----------------+

+----------------+      +----------------+
| user_locations |      |  user_follows  |
+----------------+      +----------------+
```

---

## Detalhes Tecnicos

### 1. Tabela profiles

Armazena informacoes publicas dos usuarios vinculadas ao sistema de autenticacao.

**Campos:**
- id (UUID, chave primaria, referencia auth.users)
- name (texto, nome completo)
- username (texto unico, arroba do usuario)
- avatar_url (texto, URL da foto)
- bike (texto, modelo da moto)
- level (inteiro, nivel de gamificacao, default 1)
- total_km (inteiro, quilometros totais, default 0)
- bio (texto opcional, descricao do perfil)
- created_at / updated_at (timestamps)

### 2. Tabela posts

Publicacoes dos usuarios com fotos e estatisticas das viagens.

**Campos:**
- id (UUID)
- user_id (referencia profiles)
- image_url (texto, URL da imagem)
- caption (texto, descricao)
- distance_km (decimal, distancia percorrida)
- duration_minutes (inteiro, duracao)
- location (texto, local da viagem)
- likes_count / comments_count (contadores)
- created_at

### 3. Tabela post_likes

Curtidas dos posts (relacao N:N).

**Campos:**
- id (UUID)
- post_id (referencia posts)
- user_id (referencia profiles)
- created_at
- Constraint UNIQUE(post_id, user_id)

### 4. Tabela post_comments

Comentarios nos posts.

**Campos:**
- id (UUID)
- post_id (referencia posts)
- user_id (referencia profiles)
- content (texto do comentario)
- created_at

### 5. Tabela stories

Stories temporarios de 24 horas.

**Campos:**
- id (UUID)
- user_id (referencia profiles)
- image_url (URL da imagem)
- created_at
- expires_at (timestamp, 24h apos criacao)

### 6. Tabela story_views

Registro de quem visualizou cada story.

**Campos:**
- id (UUID)
- story_id (referencia stories)
- viewer_id (referencia profiles)
- viewed_at (timestamp)
- Constraint UNIQUE(story_id, viewer_id)

### 7. Tabela groups

Grupos/comunidades de motociclistas.

**Campos:**
- id (UUID)
- name (nome do grupo)
- cover_url (imagem de capa)
- category (categoria: Marca, Regiao, Estilo)
- description (descricao)
- owner_id (referencia profiles, criador)
- member_count (contador de membros)
- created_at

### 8. Tabela group_memberships

Membros de cada grupo com seus papeis.

**Campos:**
- id (UUID)
- group_id (referencia groups)
- user_id (referencia profiles)
- role (enum: admin, moderator, member)
- joined_at
- Constraint UNIQUE(group_id, user_id)

### 9. Tabela badges

Conquistas disponiveis no sistema de gamificacao.

**Campos:**
- id (UUID)
- name (nome da conquista)
- icon (emoji ou icone)
- description (como desbloquear)
- requirement_type (tipo: km, rides, states, etc)
- requirement_value (valor necessario)
- created_at

### 10. Tabela user_badges

Conquistas desbloqueadas por cada usuario.

**Campos:**
- id (UUID)
- user_id (referencia profiles)
- badge_id (referencia badges)
- unlocked_at (quando desbloqueou)
- Constraint UNIQUE(user_id, badge_id)

### 11. Tabela user_locations

Localizacao GPS em tempo real para o mapa ao vivo.

**Campos:**
- id (UUID)
- user_id (referencia profiles)
- latitude / longitude (coordenadas)
- speed_kmh (velocidade atual)
- is_online (booleano)
- updated_at

### 12. Tabela user_follows

Sistema de seguidores (quem segue quem).

**Campos:**
- id (UUID)
- follower_id (quem segue)
- following_id (quem e seguido)
- created_at
- Constraint UNIQUE(follower_id, following_id)
- Check constraint: follower_id != following_id

### 13. Tabela user_roles

Papeis de administracao do sistema (separado de profiles por seguranca).

**Campos:**
- id (UUID)
- user_id (referencia auth.users)
- role (enum: admin, moderator, user)
- Constraint UNIQUE(user_id, role)

---

## Seguranca (RLS Policies)

Todas as tabelas terao Row Level Security habilitado com politicas apropriadas:

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| profiles | Todos | Auth (proprio) | Proprio | - |
| posts | Todos | Auth (proprio) | Proprio | Proprio |
| post_likes | Todos | Auth | - | Proprio |
| post_comments | Todos | Auth | Proprio | Proprio |
| stories | Todos | Auth | - | Proprio |
| groups | Todos | Auth | Dono | Dono |
| group_memberships | Membros | Admin/Mod | Admin/Mod | Admin/Mod ou proprio |
| badges | Todos | - | - | - |
| user_badges | Todos | Sistema | - | - |
| user_locations | Seguidores | Proprio | Proprio | Proprio |
| user_follows | Todos | Auth | - | Proprio |
| user_roles | - | Sistema | Sistema | Sistema |

---

## Funcoes Auxiliares

Serao criadas funcoes security definer para verificacoes seguras:

1. **has_role(user_id, role)** - Verifica se usuario tem determinado papel
2. **is_group_admin(group_id)** - Verifica se e admin do grupo
3. **is_group_member(group_id)** - Verifica se e membro do grupo
4. **is_following(profile_id)** - Verifica se esta seguindo o usuario

---

## Triggers Automaticos

1. **Criar perfil automaticamente** - Quando usuario se cadastra
2. **Atualizar contador de likes** - Quando like e adicionado/removido
3. **Atualizar contador de membros** - Quando alguem entra/sai do grupo
4. **Definir expiracao do story** - Automaticamente 24h apos criacao

---

## Dados Iniciais

Serao inseridos dados iniciais:

- **Badges padrao**: Iniciante, 1000km, 10000km, Madrugador, Noturno, Chuva, 5 Estados, Social
- **Categorias de grupos**: Marca, Regiao, Estilo

---

## Proximos Passos Apos Aprovacao

1. Criar migracao SQL com todas as tabelas
2. Configurar politicas RLS
3. Criar funcoes e triggers
4. Inserir dados iniciais (badges)
5. Atualizar tipos TypeScript
6. Modificar componentes para usar Supabase em vez de dados mock
7. Implementar autenticacao (necessario para funcionar com RLS)

---

## Observacao Importante

Apos criar as tabelas com RLS, sera **necessario implementar autenticacao** (login/cadastro) para que os usuarios possam interagir com os dados. Sem autenticacao, as politicas RLS bloqueiarao as operacoes.
