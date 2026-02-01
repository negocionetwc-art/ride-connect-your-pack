import { Stories } from './Stories';
import { PostCard } from './PostCard';
import { Bell, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFeedPosts } from '@/hooks/useFeedPosts';
import { Skeleton } from '@/components/ui/skeleton';

interface FeedProps {
  onProfileClick?: (userId: string) => void;
}

export const Feed = ({ onProfileClick }: FeedProps) => {
  const { data: posts, isLoading, isError } = useFeedPosts();

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/30">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="font-display text-2xl tracking-wider text-gradient">
            RideConnect
          </h1>
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }}>
              <MessageCircle className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Stories */}
      <Stories />

      {/* Divider */}
      <div className="h-px bg-border/50 mx-4" />

      {/* Posts */}
      <div className="p-4">
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border/50 rounded-2xl overflow-hidden p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="w-full aspect-[4/3] rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">Erro ao carregar publicações</p>
            <p className="text-sm text-muted-foreground">Tente novamente mais tarde</p>
          </div>
        )}

        {!isLoading && !isError && posts && posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">Nenhuma publicação ainda</p>
            <p className="text-sm text-muted-foreground">Seja o primeiro a compartilhar!</p>
          </div>
        )}

        {!isLoading && !isError && posts && posts.length > 0 && (
          <>
            {posts.map((post, index) => (
              <PostCard 
                key={post.id} 
                post={post} 
                index={index}
                onProfileClick={onProfileClick}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};
