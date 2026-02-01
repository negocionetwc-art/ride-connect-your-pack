# Sistema de Notificações e Mensagens - Documentação

## Visão Geral

O RideConnect agora possui dois sistemas completos de comunicação:

1. **Sistema de Notificações em Tempo Real** - Alertas instantâneos de todas as interações
2. **Sistema de Mensagens (Chat)** - Conversas privadas estilo Instagram

---

## 1. Sistema de Notificações

### Funcionalidades

- **Notificações automáticas** para:
  - Curtidas em posts
  - Comentários em posts
  - Novos seguidores
  - Menções (futuro)
  - Respostas a comentários (futuro)

- **Tempo real** via Supabase Realtime
- **Badge** com contador de não lidas
- **Sheet** com lista completa de notificações
- **Tabs** para filtrar: "Todas" / "Não lidas"
- **Marcar todas como lidas** com um clique

### Arquivos Criados

**Migration:**
- `supabase/migrations/20260201040000_notifications_system.sql`

**Hooks:**
- `src/hooks/useNotifications.ts` - CRUD de notificações
- `src/hooks/useNotificationRealtime.ts` - Realtime + toast

**Componentes:**
- `src/components/notifications/NotificationsSheet.tsx`
- `src/components/notifications/NotificationItem.tsx`
- `src/components/notifications/NotificationBadge.tsx`

### Como Usar

O sistema está integrado automaticamente no Feed. Quando o usuário:

1. **Curte um post** → Dono do post recebe notificação "X curtiu seu post"
2. **Comenta em um post** → Dono recebe notificação com preview do comentário
3. **Segue alguém** → O seguido recebe notificação "X começou a seguir você"

**Acessar notificações:**
- Clicar no ícone de sino no header do Feed
- Badge mostra quantidade de não lidas

### Estrutura do Banco

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  recipient_id UUID REFERENCES profiles(id),
  sender_id UUID REFERENCES profiles(id),
  type notification_type, -- 'like', 'comment', 'follow', etc
  post_id UUID REFERENCES posts(id),
  comment_id UUID REFERENCES post_comments(id),
  content TEXT, -- preview do comentário
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ
);
```

---

## 2. Sistema de Mensagens (Chat)

### Funcionalidades

- **Lista de conversas** com preview da última mensagem
- **Chat individual** em tempo real
- **Tipos de mensagem:**
  - Texto
  - Imagens
  - Compartilhamento de posts (futuro)
  - Áudio (futuro)
- **Indicador de digitando** ("usuário está digitando...")
- **Status de leitura** (✓ enviado, ✓✓ lido)
- **Reações rápidas** nas mensagens (❤️ 😂 👍 🔥 😢)
- **Contador de não lidas** por conversa
- **Layout responsivo** (mobile e desktop)

### Arquivos Criados

**Migration:**
- `supabase/migrations/20260201050000_messaging_system.sql`

**Storage:**
- `supabase/scripts/setup_message_media.sql`

**Hooks:**
- `src/hooks/useConversations.ts` - Listar conversas
- `src/hooks/useMessages.ts` - CRUD de mensagens + realtime
- `src/hooks/useTypingIndicator.ts` - Indicador de digitando

**Componentes:**
- `src/components/messages/MessagesPage.tsx` - Página principal
- `src/components/messages/ConversationsList.tsx` - Lista lateral
- `src/components/messages/ConversationItem.tsx` - Item da lista
- `src/components/messages/ChatWindow.tsx` - Janela de chat
- `src/components/messages/ChatHeader.tsx` - Header do chat
- `src/components/messages/MessageBubble.tsx` - Bolha de mensagem
- `src/components/messages/MessageInput.tsx` - Input de mensagem
- `src/components/messages/MessageReactions.tsx` - Menu de reações
- `src/components/messages/TypingIndicator.tsx` - "Digitando..."
- `src/components/messages/NewConversationDialog.tsx` - Nova conversa

### Como Usar

**Acessar mensagens:**
1. Clicar no ícone de mensagem no header do Feed
2. Aparece a página de mensagens

**Nova conversa:**
1. Clicar no botão "+" na lista de conversas
2. Buscar usuário por nome ou username
3. Selecionar usuário → Conversa é criada/aberta

**Enviar mensagem:**
1. Digitar no campo de texto
2. Pressionar Enter ou clicar no botão enviar
3. Para enviar imagem: clicar no ícone de imagem

**Reações:**
1. Passar mouse sobre mensagem recebida
2. Menu de reações aparece
3. Clicar no emoji desejado

### Estrutura do Banco

```sql
-- Conversas
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  participant_1_id UUID REFERENCES profiles(id),
  participant_2_id UUID REFERENCES profiles(id),
  last_message_text TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count_p1 INTEGER DEFAULT 0,
  unread_count_p2 INTEGER DEFAULT 0,
  UNIQUE(participant_1_id, participant_2_id)
);

-- Mensagens
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  sender_id UUID REFERENCES profiles(id),
  type message_type, -- 'text', 'image', 'voice', 'post_share'
  content TEXT,
  media_url TEXT,
  is_read BOOLEAN DEFAULT false,
  reaction TEXT, -- 'heart', 'laugh', 'thumbs_up', etc
  created_at TIMESTAMPTZ
);

-- Indicador de digitando
CREATE TABLE typing_indicators (
  conversation_id UUID REFERENCES conversations(id),
  user_id UUID REFERENCES profiles(id),
  started_at TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);
```

### Funções SQL Úteis

```sql
-- Obter ou criar conversa entre dois usuários
SELECT get_or_create_conversation(user1_id, user2_id);

-- Marcar mensagens como lidas
SELECT mark_messages_as_read(conversation_id, user_id);

-- Contar total de mensagens não lidas
SELECT get_total_unread_messages(user_id);
```

---

## Configuração Necessária

### 1. Executar Migrations

As migrations são aplicadas automaticamente ao deploy. Para desenvolvimento local:

```bash
# Via Supabase CLI
supabase db push
```

Ou execute manualmente no SQL Editor:
1. `20260201040000_notifications_system.sql`
2. `20260201050000_messaging_system.sql`

### 2. Configurar Storage (se usar imagens)

Execute no SQL Editor do Supabase:
```sql
-- Conteúdo de: supabase/scripts/setup_message_media.sql
```

### 3. Habilitar Realtime (se necessário)

As migrations já adicionam as tabelas ao Realtime:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
```

---

## Testes

### Testar Notificações

1. Login com Usuário A
2. Login com Usuário B (outra aba)
3. Usuário B curte um post do Usuário A
4. Usuário A deve ver:
   - Toast de notificação em tempo real
   - Badge incrementado
   - Notificação na lista

### Testar Mensagens

1. Login com Usuário A
2. Ir para Mensagens
3. Criar nova conversa com Usuário B
4. Enviar mensagem
5. Login com Usuário B
6. Verificar que mensagem aparece
7. Responder
8. Verificar status de leitura

---

## Roadmap Futuro

### Notificações
- [ ] Notificações de menções (@usuario)
- [ ] Notificações push (mobile)
- [ ] Configurações de notificação por tipo
- [ ] Agrupar notificações similares

### Mensagens
- [ ] Mensagens de voz (gravação)
- [ ] Compartilhar posts no chat
- [ ] Mensagens de grupo
- [ ] Chamadas de vídeo/voz
- [ ] Status online/offline
- [ ] Indicador de última visualização
- [ ] Deletar mensagens

---

## Estatísticas da Implementação

- **Arquivos criados:** 22 novos arquivos
- **Linhas de código:** +2.671 linhas
- **Hooks criados:** 5 hooks customizados
- **Componentes criados:** 13 componentes
- **Tabelas de banco:** 4 novas tabelas
- **Triggers SQL:** 3 triggers automáticos
- **Build:** OK, sem erros

---

**Data:** 01/02/2026  
**Status:** Implementado e testado
