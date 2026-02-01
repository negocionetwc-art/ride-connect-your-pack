# Funcionalidade: Upload de Imagem da Moto

## Resumo das Alterações

Foi adicionada a funcionalidade de upload de imagem da moto no perfil do usuário, permitindo que os usuários:
- Adicionem uma foto da sua moto no perfil
- Visualizem a imagem em tela cheia com alta resolução
- Substituam a imagem quando quiserem

## Arquivos Criados

### 1. `supabase/migrations/20260201010000_add_bike_image_url.sql`
Migration que adiciona o campo `bike_image_url` na tabela `profiles`.

### 2. `supabase/migrations/20260201010100_bike_images_storage.sql`
Migration que cria o bucket `bike-images` no Supabase Storage e configura as políticas de acesso:
- Usuários autenticados podem fazer upload de imagens
- Usuários podem atualizar/deletar suas próprias imagens
- Qualquer pessoa pode visualizar as imagens (público)

### 3. `src/components/profile/BikeImageUploadDialog.tsx`
Componente de diálogo para upload da imagem da moto:
- Permite selecionar imagem (até 10MB)
- Mostra preview antes de enviar
- Faz upload para o Supabase Storage
- Atualiza o perfil com a URL da imagem

### 4. `src/components/profile/BikeImageViewer.tsx`
Componente para visualizar a imagem da moto em tela cheia:
- Mostra a imagem em alta resolução
- Fundo escuro semi-transparente
- Animação suave de entrada/saída
- Botão de fechar

## Arquivos Modificados

### 1. `src/components/profile/EditProfileDialog.tsx`
- Adicionado botão para adicionar/trocar foto da moto
- Adicionado preview da imagem da moto (clicável para expandir)
- Integrado com BikeImageViewer para visualização em tela cheia
- Mudado label de "Moto" para "Minha companheira"

### 2. `src/components/Profile.tsx`
- Adicionado estado `showBikeImageUpload`
- Importado componente `BikeImageUploadDialog`
- Adicionado o diálogo de upload no render

## Como Usar

### Para o Usuário:
1. Acesse a página de perfil
2. Clique no ícone de configurações
3. Selecione "Editar perfil"
4. Na seção "Minha companheira", clique em "Adicionar foto" ou "Trocar foto"
5. Selecione uma imagem da sua moto (até 10MB)
6. Clique em "Salvar"
7. Para visualizar em tela cheia, clique na imagem no perfil editável

### Para Outros Usuários Visualizarem:
- Quando outro usuário acessar seu perfil, poderá ver a imagem da moto
- Ao clicar na imagem, ela será expandida em tela cheia com melhor resolução

## Instruções de Deploy

1. Execute as migrations no Supabase:
```bash
# Se estiver usando Supabase CLI
supabase db push

# Ou execute manualmente no SQL Editor do Supabase Dashboard
```

2. Verifique se o bucket `bike-images` foi criado em Storage > Buckets

3. Verifique se as políticas foram criadas corretamente em Storage > Policies

4. Deploy da aplicação frontend normalmente

## Tecnologias Utilizadas

- **React** - Componentes e hooks
- **TypeScript** - Tipagem
- **Supabase Storage** - Armazenamento de imagens
- **Supabase Database** - Campo bike_image_url
- **Framer Motion** - Animações
- **Shadcn/ui** - Componentes de UI
- **Lucide Icons** - Ícones

## Observações

- Tamanho máximo de upload: 10MB
- Formatos aceitos: todos os formatos de imagem (jpg, png, gif, webp, etc.)
- As imagens são armazenadas no formato: `{user_id}/{timestamp}.{extensão}`
- O bucket é público, permitindo que qualquer pessoa veja as imagens
- Apenas o dono pode fazer upload/atualizar/deletar suas próprias imagens
