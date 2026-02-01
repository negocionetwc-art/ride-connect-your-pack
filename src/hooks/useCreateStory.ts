import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB para vídeos
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB para imagens

export interface CreateStoryData {
  file: File;
  text?: string;
  text_x_percent?: number;
  text_y_percent?: number;
  text_bg?: boolean;
  stickers?: Array<{
    id: string;
    emoji: string;
    x: number;
    y: number;
  }>;
  highlight_id?: string;
  is_sponsored?: boolean;
  cta_url?: string;
}

export function useCreateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStoryData) => {
      // Verificar autenticação
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Você precisa estar autenticado. Por favor, faça login primeiro.');
      }

      const file = data.file;

      // Validar tipo de arquivo
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        throw new Error('Arquivo deve ser uma imagem ou vídeo.');
      }

      // Validar tamanho
      const maxSize = isVideo ? MAX_FILE_SIZE : MAX_IMAGE_SIZE;
      if (file.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024);
        throw new Error(`O arquivo excede o tamanho máximo de ${maxSizeMB}MB.`);
      }

      // Determinar tipo de mídia
      const mediaType = isImage ? 'image' : 'video';

      // Gerar nome do arquivo
      const fileExt = file.name.split('.').pop() || (isImage ? 'jpg' : 'mp4');
      const storyId = crypto.randomUUID();
      const fileName = `${user.id}/${storyId}.${fileExt}`;
      const filePath = fileName;

      // Upload para storage
      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        const msg = (uploadError as any)?.message || String(uploadError);

        // Mensagens específicas de erro
        if (msg.toLowerCase().includes('bucket') && msg.toLowerCase().includes('not found')) {
          throw new Error(
            'Storage não configurado. Execute a migration de stories no Supabase SQL Editor.'
          );
        }

        if (
          msg.toLowerCase().includes('row level security') ||
          msg.toLowerCase().includes('violates row-level security') ||
          msg.toLowerCase().includes('permission denied') ||
          msg.toLowerCase().includes('not allowed')
        ) {
          throw new Error(
            'Sem permissão para upload. Verifique as políticas de acesso no Supabase Storage.'
          );
        }

        throw new Error(`Erro ao fazer upload: ${msg}`);
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(filePath);

      // Criar registro na tabela stories
      // O expires_at será definido automaticamente pelo trigger (created_at + 24h)
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          media_url: publicUrl,
          media_type: mediaType,
          // Manter image_url para compatibilidade (será preenchido automaticamente se necessário)
          image_url: isImage ? publicUrl : null,
          text: data.text || null,
          text_x_percent: data.text_x_percent || null,
          text_y_percent: data.text_y_percent || null,
          text_bg: data.text_bg || null,
          stickers: data.stickers ? JSON.stringify(data.stickers) : null,
          highlight_id: data.highlight_id || null,
          is_sponsored: data.is_sponsored || null,
          cta_url: data.cta_url || null,
        })
        .select()
        .single();

      if (storyError) {
        // Limpar arquivo em caso de erro ao criar story
        await supabase.storage
          .from('stories')
          .remove([filePath])
          .catch(err => console.error('Erro ao limpar arquivo:', err));

        if (
          storyError.message.toLowerCase().includes('row level security') ||
          storyError.message.toLowerCase().includes('permission denied')
        ) {
          throw new Error('Sem permissão para criar story. Verifique se está autenticado.');
        }

        throw new Error(`Erro ao criar story: ${storyError.message}`);
      }

      return story;
    },
    onSuccess: () => {
      // Invalidar queries de stories para atualizar UI
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      
      toast({
        title: 'Story criado!',
        description: 'Seu story foi compartilhado com sucesso e expirará em 24 horas.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar story',
        description: error.message || 'Não foi possível criar o story. Tente novamente.',
        variant: 'destructive',
      });
    },
  });
}
