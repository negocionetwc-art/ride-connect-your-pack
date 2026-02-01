import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, MapPin, Clock, Navigation } from 'lucide-react';
import { Post } from '@/data/mockData';
import { PostWithProfile } from '@/hooks/useFeedPosts';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ImageCarousel } from '@/components/ui/image-carousel';
import { usePostLikes } from '@/hooks/usePostLikes';
import { useLikePost } from '@/hooks/useLikePost';
import { PostLikersDialog } from '@/components/post/PostLikersDialog';
import { PostCommentsDialog } from '@/components/post/PostCommentsDialog';
import { SharePostDialog } from '@/components/post/SharePostDialog';

interface PostCardProps {
  post: Post | PostWithProfile;
  index: number;
}

export const PostCard = ({ post, index }: PostCardProps) => {
  // Detectar se é post do banco ou mock
  const isDbPost = 'profile' in post;
  
  const [isSaved, setIsSaved] = useState(false);
  const [showLikersDialog, setShowLikersDialog] = useState(false);
  const [showCommentsDialog, setShowCommentsDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  // Hooks para curtidas (apenas para posts do banco)
  const postId = isDbPost ? (post as PostWithProfile).id : '';
  const { data: likesData } = usePostLikes(postId);
  const { mutate: toggleLike } = useLikePost();
  
  // Estado local de curtidas (para posts mock ou fallback)
  const [localIsLiked, setLocalIsLiked] = useState('isLiked' in post ? post.isLiked || false : false);
  const [localLikes, setLocalLikes] = useState(isDbPost ? post.likes_count : (post as Post).likes);
  
  // Usar dados do banco se disponível, senão usar estado local
  const isLiked = isDbPost && likesData ? likesData.isLiked : localIsLiked;
  const likes = isDbPost ? post.likes_count : localLikes;

  const handleLike = () => {
    if (isDbPost) {
      // Post do banco - usar mutation
      toggleLike({ postId, isLiked });
    } else {
      // Post mock - usar estado local
      setLocalIsLiked(!localIsLiked);
      setLocalLikes(prev => localIsLiked ? prev - 1 : prev + 1);
    }
  };
  
  const handleShowLikers = () => {
    if (isDbPost && likes > 0) {
      setShowLikersDialog(true);
    }
  };
  
  const handleShowComments = () => {
    if (isDbPost) {
      setShowCommentsDialog(true);
    }
  };
  
  const handleShare = () => {
    if (isDbPost) {
      setShowShareDialog(true);
    }
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
            <div className="flex items-center gap-1.5">
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={handleLike}
                aria-label={isLiked ? 'Descurtir' : 'Curtir'}
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
              </motion.button>
              <button
                onClick={handleShowLikers}
                className={`text-sm font-medium ${likes > 0 && isDbPost ? 'hover:text-primary cursor-pointer' : ''}`}
                aria-label="Ver curtidas"
              >
                {likes.toLocaleString()}
              </button>
            </div>

            <button 
              className="flex items-center gap-1.5"
              onClick={handleShowComments}
              aria-label="Ver comentários"
            >
              <MessageCircle className="w-6 h-6" />
              <span className="text-sm font-medium">{postData.comments}</span>
            </button>

            <button onClick={handleShare} aria-label="Compartilhar">
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
          <button 
            className="text-sm text-muted-foreground mt-2 hover:text-foreground transition-colors"
            onClick={handleShowComments}
          >
            Ver todos os {postData.comments} comentários
          </button>
        )}
      </div>

      {/* Dialog de curtidas */}
      {isDbPost && (
        <>
          <PostLikersDialog
            postId={postId}
            isOpen={showLikersDialog}
            onClose={() => setShowLikersDialog(false)}
          />
          
          <PostCommentsDialog
            postId={postId}
            isOpen={showCommentsDialog}
            onClose={() => setShowCommentsDialog(false)}
            postImage={postData.images[0]}
            postCaption={postData.caption || ''}
          />
          
          <SharePostDialog
            postId={postId}
            isOpen={showShareDialog}
            onClose={() => setShowShareDialog(false)}
            postCaption={postData.caption || ''}
          />
        </>
      )}
    </motion.article>
  );
};
