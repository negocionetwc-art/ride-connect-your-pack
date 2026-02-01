import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface CreatePostData {
  caption: string;
  images?: File[]; // Mudado de image para images (array)
  location?: string;
  distance_km?: number;
  duration_minutes?: number;
}

const MAX_IMAGES = 10; // Máximo de imagens por post
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB por imagem

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePostData) => {
      // Verificar autenticação
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Você precisa estar autenticado. Por favor, faça login primeiro.');
      }

      // Validações
      if (!data.caption && (!data.images || data.images.length === 0)) {
        throw new Error('Adicione pelo menos uma imagem ou legenda para sua publicação.');
      }

      if (data.caption && data.caption.length > 2000) {
        throw new Error('A legenda deve ter no máximo 2000 caracteres.');
      }

      if (data.images && data.images.length > MAX_IMAGES) {
        throw new Error(`Você pode adicionar no máximo ${MAX_IMAGES} imagens por post.`);
      }

      // Validar tamanho de cada imagem
      if (data.images) {
        for (const image of data.images) {
          if (image.size > MAX_IMAGE_SIZE) {
            throw new Error(`A imagem ${image.name} excede o tamanho máximo de 10MB.`);
          }
        }
      }

      const imageUrls: string[] = [];
      const uploadedPaths: string[] = [];

      // Upload de múltiplas imagens
      if (data.images && data.images.length > 0) {
        try {
          for (let i = 0; i < data.images.length; i++) {
            const image = data.images[i];
            const fileExt = image.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}_${i}.${fileExt}`;
            const filePath = fileName;

            const { error: uploadError } = await supabase.storage
              .from('post-images')
              .upload(filePath, image, {
                cacheControl: '3600',
                upsert: false,
              });

            if (uploadError) {
              console.error('Erro no upload:', uploadError);
              const msg = (uploadError as any)?.message || String(uploadError);

              // Limpar imagens já enviadas em caso de erro
              if (uploadedPaths.length > 0) {
                await supabase.storage
                  .from('post-images')
                  .remove(uploadedPaths)
                  .catch(err => console.error('Erro ao limpar imagens:', err));
              }

              // Mensagens específicas de erro
              if (msg.toLowerCase().includes('bucket') && msg.toLowerCase().includes('not found')) {
                throw new Error(
                  'Storage não configurado. Execute o script supabase/scripts/setup_post_images.sql no Supabase SQL Editor.'
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

              throw new Error(`Erro ao fazer upload da imagem ${i + 1}: ${msg}`);
            }

            uploadedPaths.push(filePath);

            // Obter URL pública
            const { data: { publicUrl } } = supabase.storage
              .from('post-images')
              .getPublicUrl(filePath);

            imageUrls.push(publicUrl);
          }
        } catch (error) {
          // Limpar todas as imagens enviadas em caso de erro
          if (uploadedPaths.length > 0) {
            await supabase.storage
              .from('post-images')
              .remove(uploadedPaths)
              .catch(err => console.error('Erro ao limpar imagens:', err));
          }
          throw error;
        }
      }

      // Criar post no banco de dados
      // Manter image_url com a primeira imagem para compatibilidade
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          image_url: imageUrls.length > 0 ? imageUrls[0] : null, // Compatibilidade
          caption: data.caption || null,
          location: data.location || null,
          distance_km: data.distance_km || null,
          duration_minutes: data.duration_minutes || null,
        })
        .select()
        .single();

      if (postError) {
        // Limpar imagens em caso de erro ao criar post
        if (uploadedPaths.length > 0) {
          await supabase.storage
            .from('post-images')
            .remove(uploadedPaths)
            .catch(err => console.error('Erro ao limpar imagens:', err));
        }

        if (
          postError.message.toLowerCase().includes('row level security') ||
          postError.message.toLowerCase().includes('permission denied')
        ) {
          throw new Error('Sem permissão para criar publicação. Verifique se está autenticado.');
        }

        throw new Error(`Erro ao criar publicação: ${postError.message}`);
      }

      // Inserir imagens na tabela post_images
      if (imageUrls.length > 0) {
        const postImages = imageUrls.map((url, index) => ({
          post_id: post.id,
          image_url: url,
          order_index: index,
        }));

        const { error: imagesError } = await supabase
          .from('post_images')
          .insert(postImages);

        if (imagesError) {
          console.error('Erro ao inserir imagens:', imagesError);
          // Não falhar o post se as imagens não forem inseridas na tabela post_images
          // O post já tem a primeira imagem em image_url para compatibilidade
        }
      }

      return post;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas a posts
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile-posts'] });
      
      toast({
        title: 'Publicação criada!',
        description: 'Sua publicação foi compartilhada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar publicação',
        description: error.message || 'Não foi possível criar a publicação. Tente novamente.',
        variant: 'destructive',
      });
    },
  });
}
