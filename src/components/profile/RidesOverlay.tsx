import { motion, AnimatePresence } from 'framer-motion';
import { X, Route, Search } from 'lucide-react';
import { useProfilePosts } from '@/hooks/useProfilePosts';
import { RideDetailOverlay } from './RideDetailOverlay';
import { useState } from 'react';
import type { Database } from '@/integrations/supabase/types';

type Post = Database['public']['Tables']['posts']['Row'];

interface RidesOverlayProps {
  open: boolean;
  onClose: () => void;
}

export const RidesOverlay = ({ open, onClose }: RidesOverlayProps) => {
  const { data: posts, isLoading } = useProfilePosts();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = posts?.filter((post) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.location?.toLowerCase().includes(query) ||
      post.caption?.toLowerCase().includes(query)
    );
  });

  if (!open) return null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background"
          >
            {/* Header */}
            <header className="sticky top-0 z-40 glass border-b border-border/30">
              <div className="flex items-center justify-between px-4 h-14">
                <div className="flex items-center gap-2">
                  <Route className="w-5 h-5 text-primary" />
                  <h1 className="font-semibold text-lg">Meus Rolês</h1>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-secondary"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </header>

            {/* Search */}
            <div className="px-4 py-3 border-b border-border/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por localização..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-card border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-4 pb-20 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">Carregando...</div>
                </div>
              ) : filteredPosts && filteredPosts.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {filteredPosts.map((post) => (
                    <motion.button
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setSelectedPost(post)}
                      className="relative aspect-[4/3] rounded-xl overflow-hidden group"
                    >
                      {post.image_url ? (
                        <img
                          src={post.image_url}
                          alt={post.caption || 'Rolê'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-orange-600/20 flex items-center justify-center">
                          <Route className="w-16 h-16 text-primary/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                        {post.location && (
                          <p className="text-white font-medium text-sm mb-1">
                            {post.location}
                          </p>
                        )}
                        {post.distance_km && (
                          <p className="text-white/90 text-xs">
                            {post.distance_km} km
                          </p>
                        )}
                        {post.created_at && (
                          <p className="text-white/70 text-xs mt-1">
                            {new Date(post.created_at).toLocaleDateString('pt-BR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Route className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? 'Nenhum rolê encontrado'
                      : 'Você ainda não registrou nenhum rolê'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedPost && (
        <RideDetailOverlay
          post={selectedPost}
          open={!!selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </>
  );
};
