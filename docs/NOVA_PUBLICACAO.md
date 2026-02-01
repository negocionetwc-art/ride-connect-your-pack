# Funcionalidade: Nova Publicação - Guia de Configuração e Teste

## ✅ Implementação Completa

A funcionalidade "Nova Publicação" está agora totalmente funcional! Usuários podem criar posts com imagens, legendas e localização que são salvos no banco de dados e exibidos no feed em tempo real.

## 📋 Pré-requisitos

Antes de testar, certifique-se de que você tem:
- Um projeto Supabase configurado
- Variáveis de ambiente configuradas (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`)
- Usuário autenticado no sistema

## 🚀 Configuração do Storage

### Passo 1: Executar o Script SQL

1. Acesse o Supabase Dashboard
2. Vá para **SQL Editor**
3. Abra o arquivo `supabase/scripts/setup_post_images.sql`
4. Copie todo o conteúdo
5. Cole no SQL Editor e clique em **Run**

Este script irá:
- ✅ Criar o bucket `post-images` público
- ✅ Configurar policies RLS para upload (usuários autenticados)
- ✅ Configurar policies RLS para visualização (público)
- ✅ Configurar policies RLS para deletar (apenas proprietário)

### Passo 2: Verificar a Configuração

Após executar o script, você verá uma verificação automática mostrando:
```
✅ Bucket post-images criado
✅ Policies criadas
```

## 📱 Como Usar

### Criar uma Nova Publicação

1. **Abrir o Modal**
   - Clique no botão "+" na navegação principal
   - O modal "Nova Publicação" será aberto

2. **Selecionar Tipo** (opcional)
   - Escolha entre: Foto, Rota, Ao Vivo ou Grupo
   - Por enquanto, apenas "Foto" está implementado

3. **Adicionar Imagem** (opcional)
   - Clique na área de upload
   - Selecione uma imagem do seu dispositivo
   - Preview será exibido automaticamente
   - Para remover: clique no "X" no canto da imagem

4. **Escrever Legenda** (opcional)
   - Digite até 2000 caracteres
   - Contador de caracteres aparece quando próximo do limite
   - Legenda é opcional se você tiver uma imagem

5. **Adicionar Localização** (opcional)
   - Digite o nome do local no campo de localização
   - Exemplo: "São Paulo - SP"

6. **Publicar**
   - Clique em "Publicar"
   - Aguarde o upload (botão mostrará "Publicando...")
   - Toast de sucesso será exibido
   - Modal fechará automaticamente
   - Post aparecerá no feed

### Requisitos Mínimos

✅ **Pelo menos um dos seguintes:**
- Imagem OU
- Legenda (texto)

❌ **Validações:**
- Imagem deve ser menor que 10MB
- Imagem deve ser do tipo: JPG, PNG, GIF, WEBP
- Legenda deve ter no máximo 2000 caracteres

## 🧪 Testes Funcionais

Execute os seguintes testes para validar a implementação:

### ✅ Testes Básicos

1. **Criar post com imagem e legenda**
   - Adicione uma imagem
   - Digite uma legenda
   - Clique em Publicar
   - ✅ Post aparece no feed

2. **Criar post apenas com imagem**
   - Adicione apenas uma imagem
   - Deixe legenda em branco
   - Clique em Publicar
   - ✅ Post aparece no feed

3. **Criar post apenas com legenda**
   - Não adicione imagem
   - Digite apenas uma legenda
   - Clique em Publicar
   - ✅ Post aparece no feed

### ✅ Testes de Validação

4. **Validação: sem conteúdo**
   - Não adicione imagem nem legenda
   - Clique em Publicar
   - ❌ Deve mostrar erro: "Adicione pelo menos uma imagem ou legenda"

5. **Validação: imagem muito grande**
   - Tente fazer upload de imagem > 10MB
   - ❌ Deve mostrar erro: "A imagem deve ter no máximo 10MB"

6. **Validação: formato inválido**
   - Tente fazer upload de arquivo não-imagem (ex: PDF)
   - ❌ Deve mostrar erro: "Por favor, selecione uma imagem"

7. **Validação: legenda muito longa**
   - Digite mais de 2000 caracteres
   - Clique em Publicar
   - ❌ Deve mostrar erro e contador ficará vermelho

### ✅ Testes de UX

8. **Preview de imagem**
   - Selecione uma imagem
   - ✅ Preview aparece imediatamente
   - Clique no X para remover
   - ✅ Preview desaparece

9. **Contador de caracteres**
   - Digite texto na legenda
   - ✅ Contador aparece quando próximo do limite
   - ✅ Fica vermelho se ultrapassar

10. **Loading state**
    - Crie um post
    - ✅ Botão muda para "Publicando..."
    - ✅ Formulário fica desabilitado
    - ✅ Não é possível fechar o modal durante upload

11. **Feedback de sucesso**
    - Após publicar com sucesso
    - ✅ Toast verde aparece
    - ✅ Modal fecha automaticamente
    - ✅ Post aparece no topo do feed

### ✅ Testes de Autenticação

12. **Sem autenticação**
    - Faça logout
    - Tente criar um post
    - ❌ Deve mostrar erro de autenticação

## 🔧 Troubleshooting

### Erro: "Storage não configurado"

**Causa:** Bucket `post-images` não foi criado

**Solução:**
1. Execute o script `supabase/scripts/setup_post_images.sql` no Supabase SQL Editor
2. Verifique no Supabase Dashboard → Storage se o bucket `post-images` existe

### Erro: "Sem permissão para upload"

**Causa:** Policies RLS não estão configuradas corretamente

**Solução:**
1. No Supabase Dashboard, vá para Storage → post-images → Policies
2. Verifique se existem 4 policies:
   - `Authenticated users can upload post images` (INSERT)
   - `Users can update their own post images` (UPDATE)
   - `Users can delete their own post images` (DELETE)
   - `Anyone can view post images` (SELECT)
3. Se não existirem, execute o script SQL novamente

### Erro: "Sem permissão para criar publicação"

**Causa:** Usuário não está autenticado ou políticas RLS da tabela `posts` estão incorretas

**Solução:**
1. Verifique se o usuário está logado
2. Verifique as policies RLS da tabela `posts` no Supabase
3. Deve existir: `Users can insert their own posts` (INSERT)

### Posts não aparecem no feed

**Causa:** Query pode estar falhando ou não há posts ainda

**Solução:**
1. Abra o Developer Tools (F12)
2. Vá para a aba Console
3. Verifique se há erros
4. Tente criar um novo post
5. Recarregue a página

## 📊 Estrutura de Dados

### Tabela: `posts`

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  image_url TEXT NULL,
  caption TEXT NULL,
  location TEXT NULL,
  distance_km DECIMAL(10,2) NULL,
  duration_minutes INTEGER NULL,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Storage Bucket: `post-images`

- **Tipo:** Público
- **Pasta por usuário:** `{user_id}/timestamp.ext`
- **Formatos aceitos:** JPG, PNG, GIF, WEBP
- **Tamanho máximo:** 10MB por imagem

## 🎯 Funcionalidades Implementadas

✅ Upload de imagens para Supabase Storage
✅ Preview de imagem antes do upload
✅ Validação de tipo e tamanho de arquivo
✅ Campo de legenda com contador de caracteres
✅ Campo de localização
✅ Validações client-side
✅ Estados de loading durante upload
✅ Feedback com toasts de sucesso/erro
✅ Integração com banco de dados Supabase
✅ Exibição de posts no feed em tempo real
✅ Suporte para posts sem imagem (apenas texto)
✅ Suporte para posts sem legenda (apenas imagem)
✅ Cache automático com React Query
✅ Invalidação de cache após criar post
✅ Formatação de timestamps (ex: "há 5 minutos")
✅ Compatibilidade com dados mockados (transição suave)

## 🚧 Funcionalidades Futuras

- [ ] Múltiplas imagens por post
- [ ] Marcar outros usuários
- [ ] Anexar rota GPS do RideTracker
- [ ] Diferentes tipos de post (Ao Vivo, Rota, Grupo)
- [ ] Editar posts existentes
- [ ] Deletar posts
- [ ] Compressão de imagens antes do upload
- [ ] Upload progressivo com porcentagem
- [ ] Rascunhos salvos localmente
- [ ] Agendamento de posts

## 📁 Arquivos Criados/Modificados

### Novos Arquivos
- `supabase/scripts/setup_post_images.sql` - Script de configuração do storage
- `src/hooks/useCreatePost.ts` - Hook para criar posts
- `src/hooks/useFeedPosts.ts` - Hook para buscar posts do feed
- `docs/NOVA_PUBLICACAO.md` - Este documento

### Arquivos Modificados
- `src/components/CreatePost.tsx` - Adicionada lógica completa
- `src/components/Feed.tsx` - Integrado com dados reais
- `src/components/PostCard.tsx` - Suporte para posts do banco

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do console do navegador (F12)
2. Verifique os logs do Supabase Dashboard
3. Confirme que todas as migrations foram executadas
4. Confirme que o bucket `post-images` existe e tem policies configuradas
