import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Edit2, Award, Route, Clock, Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import { useProfileBadges } from '@/hooks/useProfileBadges';
import { useProfilePosts } from '@/hooks/useProfilePosts';
import { AuthPanel } from './profile/AuthPanel';
import { SettingsSheet } from './profile/SettingsSheet';
import { EditProfileDialog } from './profile/EditProfileDialog';
import { AvatarUploadDialog } from './profile/AvatarUploadDialog';
import { BadgesOverlay } from './profile/BadgesOverlay';
import { BadgeDetailDialog } from './profile/BadgeDetailDialog';
import { RidesOverlay } from './profile/RidesOverlay';
import { RideDetailOverlay } from './profile/RideDetailOverlay';
import { LevelDetailOverlay } from './profile/LevelDetailOverlay';
import type { BadgeWithUnlocked } from '@/hooks/useProfileBadges';
import type { Database } from '@/integrations/supabase/types';

type Post = Database['public']['Tables']['posts']['Row'];

export const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [showBadgesOverlay, setShowBadgesOverlay] = useState(false);
  const [showRidesOverlay, setShowRidesOverlay] = useState(false);
  const [showLevelDetail, setShowLevelDetail] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithUnlocked | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);

  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const { data: stats, isLoading: isLoadingStats } = useProfileStats();
  const { data: badges, isLoading: isLoadingBadges } = useProfileBadges();
  const { data: posts, isLoading: isLoadingPosts } = useProfilePosts(3);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Erro ao verificar usuário:', error);
          setUser(null);
        } else {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setUser(null);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setIsLoadingAuth(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Mostrar AuthPanel se não estiver autenticado
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen pb-20 flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPanel />;
  }

  // Formatar valores para exibição
  const formatKm = (km: number) => {
    if (km >= 1000) {
      return `${(km / 1000).toFixed(1)}k`;
    }
    return km.toString();
  };

  const statsData = [
    {
      label: 'Km Total',
      value: stats ? formatKm(stats.totalKm) : '0',
      icon: Route,
      onClick: () => {
        setSelectedStat('rides');
        setShowRidesOverlay(true);
      },
    },
    {
      label: 'Rolês',
      value: stats?.ridesCount?.toString() || '0',
      icon: Flame,
      onClick: () => {
        setSelectedStat('rides');
        setShowRidesOverlay(true);
      },
    },
    {
      label: 'Horas',
      value: stats?.totalHours?.toString() || '0',
      icon: Clock,
      onClick: () => {
        setSelectedStat('rides');
        setShowRidesOverlay(true);
      },
    },
    {
      label: 'Badges',
      value: stats?.badgesCount?.toString() || '0',
      icon: Award,
      onClick: () => setShowBadgesOverlay(true),
    },
  ];

  const displayedBadges = badges?.slice(0, 8) || [];

  return (
    <>
      <div className="min-h-screen pb-20">
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-border/30">
          <div className="flex items-center justify-between px-4 h-14">
            <h1 className="font-semibold text-lg">Perfil</h1>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          </div>
        </header>

        {/* Profile Header */}
        <div className="relative">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-br from-primary/40 via-orange-600/30 to-background" />

          {/* Avatar & Info */}
          <div className="px-4 pb-4">
            <div className="relative -mt-16 flex items-end gap-4">
              <div className="relative">
                <img
                  src={
                    profile?.avatar_url ||
                    'https://via.placeholder.com/150?text=No+Avatar'
                  }
                  alt={profile?.name || 'Usuário'}
                  className="w-28 h-28 rounded-full border-4 border-background object-cover"
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAvatarUpload(true)}
                  className="absolute bottom-1 right-1 p-2 bg-primary rounded-full"
                >
                  <Edit2 className="w-4 h-4 text-primary-foreground" />
                </motion.button>
              </div>

              <div
                className="flex-1 pb-2 cursor-pointer"
                onClick={() => setShowEditProfile(true)}
              >
                <h2 className="text-xl font-bold">{profile?.name || 'Usuário'}</h2>
                <p className="text-sm text-muted-foreground">
                  @{profile?.username || 'username'}
                </p>
              </div>
            </div>

            {/* Bike Info */}
            {profile?.bike && (
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowEditProfile(true)}
                className="mt-4 p-4 bg-card rounded-xl border border-border/50 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🏍️</div>
                  <div>
                    <p className="font-semibold">{profile.bike}</p>
                    <p className="text-sm text-muted-foreground">
                      Minha companheira
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Level Progress */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowLevelDetail(true)}
              className="mt-4 p-4 bg-card rounded-xl border border-border/50 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Nível {profile?.level || 1}
                </span>
                <span className="text-xs text-primary font-medium">
                  Toque para ver detalhes
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '68%' }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full"
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="px-4 mb-6">
          <div className="grid grid-cols-4 gap-3">
            {statsData.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.button
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={stat.onClick}
                  className="bg-card rounded-xl p-3 text-center border border-border/50 hover:border-primary/50 transition-colors"
                >
                  <Icon className="w-5 h-5 mx-auto text-primary mb-1" />
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Badges */}
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              Conquistas
            </h3>
            <button
              onClick={() => setShowBadgesOverlay(true)}
              className="text-sm text-primary font-medium hover:underline"
            >
              Ver todas
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {isLoadingBadges ? (
              <div className="text-muted-foreground text-sm">Carregando...</div>
            ) : displayedBadges.length > 0 ? (
              displayedBadges.map((badge, index) => (
                <motion.button
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedBadge(badge)}
                  className={`flex-shrink-0 p-3 rounded-xl border text-center min-w-[80px] ${
                    badge.unlocked
                      ? 'bg-card border-primary/30 hover:border-primary/50'
                      : 'bg-secondary/50 border-border/30 opacity-50'
                  }`}
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <p className="text-[10px] font-medium mt-1 truncate">{badge.name}</p>
                </motion.button>
              ))
            ) : (
              <div className="text-muted-foreground text-sm">
                Nenhuma conquista ainda
              </div>
            )}
          </div>
        </div>

        {/* Recent Rides */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Route className="w-4 h-4 text-primary" />
              Últimos Rolês
            </h3>
            <button
              onClick={() => setShowRidesOverlay(true)}
              className="text-sm text-primary font-medium hover:underline"
            >
              Ver todos
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {isLoadingPosts ? (
              <div className="col-span-3 text-center text-muted-foreground text-sm py-4">
                Carregando...
              </div>
            ) : posts && posts.length > 0 ? (
              posts.map((post, index) => (
                <motion.button
                  key={post.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedPost(post)}
                  className="relative aspect-square rounded-xl overflow-hidden"
                >
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.caption || 'Rolê'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-orange-600/20 flex items-center justify-center">
                      <Route className="w-8 h-8 text-primary/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-[10px] text-white font-medium truncate">
                      {post.distance_km ? `${post.distance_km} km` : 'Rolê'}
                    </p>
                  </div>
                </motion.button>
              ))
            ) : (
              <div className="col-span-3 text-center text-muted-foreground text-sm py-4">
                Você ainda não registrou nenhum rolê
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals and Overlays */}
      <SettingsSheet
        open={showSettings}
        onOpenChange={setShowSettings}
        onEditProfile={() => setShowEditProfile(true)}
        onEditAvatar={() => setShowAvatarUpload(true)}
      />

      <EditProfileDialog
        open={showEditProfile}
        onOpenChange={setShowEditProfile}
      />

      <AvatarUploadDialog
        open={showAvatarUpload}
        onOpenChange={setShowAvatarUpload}
      />

      <BadgesOverlay
        open={showBadgesOverlay}
        onClose={() => setShowBadgesOverlay(false)}
      />

      {selectedBadge && (
        <BadgeDetailDialog
          badge={selectedBadge}
          open={!!selectedBadge}
          onOpenChange={(open) => !open && setSelectedBadge(null)}
        />
      )}

      <RidesOverlay
        open={showRidesOverlay}
        onClose={() => setShowRidesOverlay(false)}
      />

      {selectedPost && (
        <RideDetailOverlay
          post={selectedPost}
          open={!!selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}

      <LevelDetailOverlay
        open={showLevelDetail}
        onClose={() => setShowLevelDetail(false)}
      />
    </>
  );
};
