import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Post = Database['public']['Tables']['posts']['Row'];

export type PostImage = {
  id: string;
  post_id: string;
  image_url: string;
  order_index: number;
  created_at: string;
};

export type PostWithProfile = Post & {
  profile: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
  };
  images: string[]; // Array de URLs das imagens
};

export function useFeedPosts(limit: number = 20) {
  return useQuery({
    queryKey: ['feed-posts', limit],
    queryFn: async (): Promise<PostWithProfile[]> => {
      // Buscar posts com perfis
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profile:profiles!posts_user_id_fkey (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (postsError) {
        console.error('Erro ao buscar posts:', postsError);
        throw postsError;
      }

      if (!postsData || postsData.length === 0) {
        return [];
      }

      // Tentar buscar imagens de todos os posts (tabela pode não existir)
      const postIds = postsData.map(post => post.id);
      let imagesData: PostImage[] | null = null;
      
      try {
        const { data, error: imagesError } = await (supabase as any)
          .from('post_images')
          .select('*')
          .in('post_id', postIds)
          .order('order_index', { ascending: true });

        if (imagesError) {
          // Se tabela não existe, continuar sem as imagens extras
          if (!imagesError.message?.includes('does not exist')) {
            console.error('Erro ao buscar imagens:', imagesError);
          }
        } else {
          imagesData = data;
        }
      } catch (err) {
        console.warn('Erro ao buscar post_images:', err);
      }

      // Agrupar imagens por post_id
      const imagesByPost = new Map<string, string[]>();
      if (imagesData) {
        imagesData.forEach((img) => {
          if (!imagesByPost.has(img.post_id)) {
            imagesByPost.set(img.post_id, []);
          }
          imagesByPost.get(img.post_id)!.push(img.image_url);
        });
      }

      // Combinar posts com suas imagens
      return postsData.map(post => {
        const images = imagesByPost.get(post.id) || [];
        
        // Se não houver imagens na tabela post_images, mas houver em image_url (compatibilidade)
        if (images.length === 0 && post.image_url) {
          images.push(post.image_url);
        }

        return {
          ...post,
          profile: Array.isArray(post.profile) ? post.profile[0] : post.profile,
          images,
        };
      }) as PostWithProfile[];
    },
  });
}
