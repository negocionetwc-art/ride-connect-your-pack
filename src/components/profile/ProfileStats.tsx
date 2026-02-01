import { motion } from 'framer-motion';

interface ProfileStatsProps {
  posts: number;
  followers: number;
  following: number;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
}

export function ProfileStats({
  posts,
  followers,
  following,
  onFollowersClick,
  onFollowingClick,
}: ProfileStatsProps) {
  return (
    <div className="flex justify-around items-center py-4 text-center">
      {/* Posts - não clicável */}
      <div className="flex flex-col gap-0.5 min-w-[80px]">
        <strong className="text-lg font-semibold text-foreground">{posts}</strong>
        <span className="text-[13px] text-muted-foreground">posts</span>
      </div>

      {/* Seguidores - clicável */}
      <motion.div
        whileTap={onFollowersClick ? { scale: 0.95, opacity: 0.6 } : undefined}
        className={`flex flex-col gap-0.5 min-w-[80px] ${
          onFollowersClick ? 'cursor-pointer' : ''
        }`}
        onClick={onFollowersClick}
      >
        <strong className="text-lg font-semibold text-foreground">{followers}</strong>
        <span className="text-[13px] text-muted-foreground">seguidores</span>
      </motion.div>

      {/* Seguindo - clicável */}
      <motion.div
        whileTap={onFollowingClick ? { scale: 0.95, opacity: 0.6 } : undefined}
        className={`flex flex-col gap-0.5 min-w-[80px] ${
          onFollowingClick ? 'cursor-pointer' : ''
        }`}
        onClick={onFollowingClick}
      >
        <strong className="text-lg font-semibold text-foreground">{following}</strong>
        <span className="text-[13px] text-muted-foreground">seguindo</span>
      </motion.div>
    </div>
  );
}
