# Guia de Teste - Upload de Imagem da Moto

## ✅ Pré-requisitos

Antes de testar, certifique-se de que:

1. ✅ As migrations foram aplicadas no banco de dados
2. ✅ O bucket `bike-images` foi criado no Supabase Storage
3. ✅ As políticas de acesso foram configuradas
4. ✅ Você está logado na aplicação

## 🚀 Como Aplicar as Migrations

### Opção 1: Usando Supabase CLI (Recomendado)
```bash
# No diretório do projeto
supabase db push
```

### Opção 2: Manualmente no Supabase Dashboard
1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Copie e cole o conteúdo de `supabase/scripts/setup_bike_images.sql`
5. Clique em **Run**
6. Verifique se as mensagens de sucesso aparecem

## 🧪 Passo a Passo para Testar

### 1. Adicionar Imagem da Moto

1. Faça login na aplicação
2. Vá para a aba **Perfil** (última aba do menu inferior)
3. Clique no ícone de **engrenagem** (⚙️) no canto superior direito
4. Selecione **Editar perfil**
5. Role até a seção **Minha companheira**
6. Você verá um ícone de moto (🏍️) e um botão **"Adicionar foto"**
7. Clique em **"Adicionar foto"**
8. Selecione uma imagem da sua moto do seu computador
   - Formatos aceitos: JPG, PNG, GIF, WEBP, etc.
   - Tamanho máximo: 10MB
9. Você verá um preview da imagem
10. Clique em **"Salvar"**
11. Aguarde o upload ser concluído
12. Você receberá uma notificação de sucesso

### 2. Visualizar a Imagem da Moto

Depois de adicionar a imagem:

1. Volte para **Editar perfil**
2. Você verá a imagem da moto no lugar do ícone
3. **Clique na imagem** para vê-la em tela cheia com alta resolução
4. Uma janela modal escura aparecerá com a imagem em tamanho grande
5. Clique no **X** ou fora da imagem para fechar

### 3. Trocar a Imagem da Moto

1. Vá para **Editar perfil**
2. O botão agora dirá **"Trocar foto"** ao invés de "Adicionar foto"
3. Clique em **"Trocar foto"**
4. Selecione uma nova imagem
5. Clique em **"Salvar"**
6. A imagem antiga será substituída pela nova

### 4. Visualizar em Outros Perfis (Opcional)

Para testar a visualização pública:

1. Crie ou acesse uma segunda conta
2. Acesse o perfil do usuário que tem imagem da moto
3. Você deverá ver a imagem da moto no perfil dele
4. Clique na imagem para expandi-la

## ✅ Checklist de Testes

- [ ] Consigo abrir o diálogo de upload de imagem
- [ ] Consigo selecionar uma imagem do meu computador
- [ ] O preview da imagem aparece corretamente
- [ ] O upload é concluído com sucesso
- [ ] A imagem aparece no perfil depois do upload
- [ ] Consigo clicar na imagem para ver em tela cheia
- [ ] A visualização em tela cheia mostra a imagem com boa resolução
- [ ] Consigo fechar a visualização em tela cheia
- [ ] Consigo trocar a imagem por outra
- [ ] A validação de tamanho máximo funciona (tente fazer upload de arquivo > 10MB)
- [ ] A validação de tipo de arquivo funciona (tente fazer upload de PDF ou outro arquivo não-imagem)

## 🐛 Problemas Comuns

### "Bucket 'bike-images' não encontrado"
**Solução:** Execute o script `supabase/scripts/setup_bike_images.sql` no SQL Editor do Supabase Dashboard.

### "Sem permissão para upload no bucket 'bike-images'"
**Solução:** Verifique se as políticas (policies) foram criadas corretamente. Execute o script de setup novamente.

### "Você precisa estar autenticado para fazer upload"
**Solução:** Faça logout e login novamente na aplicação.

### A imagem não aparece depois do upload
**Solução:** 
1. Verifique se o bucket está configurado como público
2. Recarregue a página
3. Verifique no Supabase Storage se o arquivo foi realmente enviado

### Erro ao clicar para expandir a imagem
**Solução:** Certifique-se de que a imagem está salva e o perfil foi atualizado corretamente.

## 📱 Testando em Diferentes Dispositivos

- [ ] Desktop (Chrome)
- [ ] Desktop (Firefox)
- [ ] Desktop (Edge)
- [ ] Mobile (Safari iOS)
- [ ] Mobile (Chrome Android)
- [ ] Tablet

## 🎯 Resultado Esperado

Após concluir todos os testes, você deve ter:
- ✅ Uma imagem da sua moto no perfil
- ✅ Capacidade de visualizar a imagem em alta resolução
- ✅ Capacidade de trocar a imagem quando quiser
- ✅ Validações funcionando (tamanho e tipo de arquivo)
- ✅ Notificações de sucesso e erro funcionando

## 📸 Screenshots Esperados

1. **Editar Perfil - Sem Imagem:**
   - Ícone de moto (🏍️)
   - Botão "Adicionar foto"

2. **Editar Perfil - Com Imagem:**
   - Miniatura da imagem da moto
   - Botão "Trocar foto"
   - Texto "Clique na imagem para ver em tamanho grande"

3. **Visualização em Tela Cheia:**
   - Fundo escuro semi-transparente
   - Imagem centralizada em alta resolução
   - Botão X para fechar no canto superior direito
   - Nome da moto na parte inferior (se cadastrado)

## 📝 Feedback

Se encontrar algum problema ou tiver sugestões de melhoria, documente:
- O que você estava fazendo
- O que esperava que acontecesse
- O que realmente aconteceu
- Mensagens de erro (se houver)
- Screenshots (se possível)
