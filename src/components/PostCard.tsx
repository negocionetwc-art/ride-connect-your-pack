import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, MapPin, Clock, Navigation } from 'lucide-react';
import { Post } from '@/data/mockData';

interface PostCardProps {
  post: Post;
  index: number;
}

export const PostCard = ({ post, index }: PostCardProps) => {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likes, setLikes] = useState(post.likes);
  const [isSaved, setIsSaved] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-card border border-border/50 rounded-2xl overflow-hidden mb-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <img
          src={post.user.avatar}
          alt={post.user.name}
          className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/30"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{post.user.name}</span>
            <span className="text-xs text-primary">Lvl {post.user.level}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            {post.location}
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{post.timestamp}</span>
      </div>

      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={post.image}
          alt={post.caption}
          className="w-full h-full object-cover"
        />
        
        {/* Stats Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
          <div className="flex items-center gap-4 text-white/90 text-sm">
            <div className="flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-primary" />
              <span className="font-medium">{post.distance} km</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-medium">{post.duration}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={handleLike}
              className="flex items-center gap-1.5"
            >
              <motion.div
                animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Heart
                  className={`w-6 h-6 transition-colors ${
                    isLiked ? 'fill-red-500 text-red-500' : 'text-foreground'
                  }`}
                />
              </motion.div>
              <span className="text-sm font-medium">{likes.toLocaleString()}</span>
            </motion.button>

            <button className="flex items-center gap-1.5">
              <MessageCircle className="w-6 h-6" />
              <span className="text-sm font-medium">{post.comments}</span>
            </button>

            <button>
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => setIsSaved(!isSaved)}
          >
            <Bookmark
              className={`w-6 h-6 transition-colors ${
                isSaved ? 'fill-primary text-primary' : ''
              }`}
            />
          </motion.button>
        </div>

        {/* Caption */}
        <p className="text-sm">
          <span className="font-semibold">{post.user.username}</span>{' '}
          <span className="text-foreground/90">{post.caption}</span>
        </p>

        {post.comments > 0 && (
          <button className="text-sm text-muted-foreground mt-2">
            Ver todos os {post.comments} comentários
          </button>
        )}
      </div>
    </motion.article>
  );
};
