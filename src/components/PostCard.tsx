import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, MapPin, Clock, Navigation } from 'lucide-react';
import { Post } from '@/data/mockData';
import { PostWithProfile } from '@/hooks/useFeedPosts';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ImageCarousel } from '@/components/ui/image-carousel';

interface PostCardProps {
  post: Post | PostWithProfile;
  index: number;
}

export const PostCard = ({ post, index }: PostCardProps) => {
  // Detectar se é post do banco ou mock
  const isDbPost = 'profile' in post;
  
  const [isLiked, setIsLiked] = useState('isLiked' in post ? post.isLiked || false : false);
  const [likes, setLikes] = useState(isDbPost ? post.likes_count : (post as Post).likes);
  const [isSaved, setIsSaved] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  // Extrair dados do usuário
  const userData = isDbPost 
    ? {
        name: (post as PostWithProfile).profile.name,
        username: (post as PostWithProfile).profile.username,
        avatar: (post as PostWithProfile).profile.avatar_url || '/placeholder.svg',
        level: 1, // Pode ser adicionado ao profile depois
      }
    : (post as Post).user;

  // Extrair dados do post
  const postData = {
    images: isDbPost ? (post as PostWithProfile).images : [(post as Post).image],
    caption: isDbPost ? (post as PostWithProfile).caption : (post as Post).caption,
    location: isDbPost ? (post as PostWithProfile).location : (post as Post).location,
    distance: isDbPost ? (post as PostWithProfile).distance_km : (post as Post).distance,
    duration: isDbPost 
      ? (post as PostWithProfile).duration_minutes 
        ? `${(post as PostWithProfile).duration_minutes} min` 
        : null
      : (post as Post).duration,
    timestamp: isDbPost 
      ? formatDistanceToNow(new Date((post as PostWithProfile).created_at), { 
          addSuffix: true, 
          locale: ptBR 
        })
      : (post as Post).timestamp,
    comments: isDbPost ? (post as PostWithProfile).comments_count : (post as Post).comments,
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
          src={userData.avatar}
          alt={userData.name}
          className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/30"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{userData.name}</span>
            <span className="text-xs text-primary">Lvl {userData.level}</span>
          </div>
          {postData.location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {postData.location}
            </div>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{postData.timestamp}</span>
      </div>

      {/* Images Carousel */}
      {postData.images && postData.images.length > 0 && (
        <div className="relative">
          <ImageCarousel 
            images={postData.images.filter(img => img)} 
            alt={postData.caption || 'Post'}
          />
          
          {/* Stats Overlay */}
          {(postData.distance || postData.duration) && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
              <div className="flex items-center gap-4 text-white/90 text-sm">
                {postData.distance && (
                  <div className="flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-primary" />
                    <span className="font-medium">{postData.distance} km</span>
                  </div>
                )}
                {postData.duration && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="font-medium">{postData.duration}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

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
              <span className="text-sm font-medium">{postData.comments}</span>
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
        {postData.caption && (
          <p className="text-sm">
            <span className="font-semibold">{userData.username}</span>{' '}
            <span className="text-foreground/90">{postData.caption}</span>
          </p>
        )}

        {postData.comments > 0 && (
          <button className="text-sm text-muted-foreground mt-2">
            Ver todos os {postData.comments} comentários
          </button>
        )}
      </div>
    </motion.article>
  );
};
