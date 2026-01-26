import { Stories } from './Stories';
import { PostCard } from './PostCard';
import { posts } from '@/data/mockData';
import { Bell, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const Feed = () => {
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
        {posts.map((post, index) => (
          <PostCard key={post.id} post={post} index={index} />
        ))}
      </div>
    </div>
  );
};
