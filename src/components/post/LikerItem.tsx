import { PostLiker } from '@/hooks/usePostLikers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LikerItemProps {
  liker: PostLiker;
}

export const LikerItem = ({ liker }: LikerItemProps) => {
  const { profile } = liker;

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
      <Avatar className="w-10 h-10 ring-2 ring-primary/30">
        <AvatarImage src={profile.avatar_url || '/placeholder.svg'} alt={profile.name} />
        <AvatarFallback>{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm truncate">{profile.name}</p>
          <span className="text-xs text-primary shrink-0">Lvl {profile.level}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
      </div>
    </div>
  );
};
