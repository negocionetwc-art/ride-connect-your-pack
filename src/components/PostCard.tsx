import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, MapPin, Clock, Navigation } from 'lucide-react';
import { Post } from '@/data/mockData';
import { PostWithProfile } from '@/hooks/useFeedPosts';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FeedMediaCarousel } from '@/components/ui/feed-media-carousel';
import { PostMediaDetail } from '@/components/ui/post-media-detail';
import { usePostLikes } from '@/hooks/usePostLikes';
import { useLikePost } from '@/hooks/useLikePost';
import { PostLikersDialog } from '@/components/post/PostLikersDialog';
import { PostCommentsDialog } from '@/components/post/PostCommentsDialog';
import { SharePostDialog } from '@/components/post/SharePostDialog';
import { PostOptionsMenu } from '@/components/post/PostOptionsMenu';
import { EditPostDialog } from '@/components/post/EditPostDialog';
import { useDeletePost } from '@/hooks/useDeletePost';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PostCardProps {
  post: Post | PostWithProfile;
  index: number;
  onProfileClick?: (userId: string) => void;
}

export const PostCard = ({ post, index, onProfileClick }: PostCardProps) => {
  // Detectar se é post do banco ou mock
  const isDbPost = 'profile' in post;
  
  const [isSaved, setIsSaved] = useState(false);
  const [showLikersDialog, setShowLikersDialog] = useState(false);
  const [showCommentsDialog, setShowCommentsDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showMediaDetail, setShowMediaDetail] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Hooks para curtidas (apenas para posts do banco)
  const postId = isDbPost ? (post as PostWithProfile).id : '';
  const { data: likesData } = usePostLikes(postId);
  const { mutate: toggleLike } = useLikePost();
  const { mutate: deletePost, isPending: isDeleting } = useDeletePost();
  
  // Verificar se é o autor do post
  useEffect(() => {
    if (isDbPost) {
      supabase.auth.getUser().then(({ data }) => {
        const userId = data.user?.id;
        setCurrentUserId(userId || null);
        setIsAuthor(userId === (post as PostWithProfile).user_id);
      });
    }
  }, [isDbPost, post]);
  
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

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (isDbPost) {
      deletePost({ postId });
    }
  };

  const handleProfileClick = () => {
    if (isDbPost && onProfileClick) {
      onProfileClick((post as PostWithProfile).user_id);
    }
  };

  // Extrair dados do usuário
  const userData = isDbPost 
    ? {
        name: (post as PostWithProfile).profile.name,
        username: (post as PostWithProfile).profile.username,
        avatar: (post as PostWithProfile).profile.avatar_url || '/placeholder.svg',
        level: 1, // Pode ser adicionado ao profile depois
        userId: (post as PostWithProfile).user_id,
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
      {/* Media Carousel with Instagram-like aspect ratio */}
      {postData.images && postData.images.length > 0 && (
        <div className="relative group">
          <FeedMediaCarousel 
            images={postData.images.filter(img => img)} 
            alt={postData.caption || 'Post'}
            onClick={() => setShowMediaDetail(true)}
            className="cursor-pointer"
          />
          
          {/* Header Overlay - Informações do usuário sobre a imagem */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent p-3 z-10">
            <div className="flex items-center gap-3">
              <button 
                onClick={handleProfileClick}
                className="shrink-0 hover:opacity-80 transition-opacity"
              >
                <img
                  src={userData.avatar}
                  alt={userData.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white/30"
                />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleProfileClick}
                    className="font-semibold text-sm text-white hover:opacity-80 transition-opacity truncate"
                  >
                    {userData.name}
                  </button>
                  <span className="text-xs text-primary shrink-0">Lvl {userData.level}</span>
                </div>
                {postData.location && (
                  <div className="flex items-center gap-1 text-xs text-white/90">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{postData.location}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-white/80">{postData.timestamp}</span>
                {isDbPost && (
                  <PostOptionsMenu
                    isAuthor={isAuthor}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                )}
              </div>
            </div>
          </div>
          
          {/* Stats Overlay */}
          {(postData.distance || postData.duration) && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pointer-events-none">
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

          {/* Dialog de edição */}
          <EditPostDialog
            postId={postId}
            currentCaption={postData.caption || ''}
            isOpen={showEditDialog}
            onClose={() => setShowEditDialog(false)}
          />
        </>
      )}

      {/* Media Detail View - Instagram-like full screen */}
      {showMediaDetail && (
        <AnimatePresence>
          <PostMediaDetail
            images={postData.images.filter(img => img)}
            alt={postData.caption || 'Post'}
            onClose={() => setShowMediaDetail(false)}
          />
        </AnimatePresence>
      )}

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir publicação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Seu post será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.article>
  );
};
