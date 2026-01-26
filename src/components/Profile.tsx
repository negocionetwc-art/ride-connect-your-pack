import { motion } from 'framer-motion';
import { Settings, Edit2, MapPin, Calendar, Award, Route, Clock, Flame } from 'lucide-react';
import { currentUser, badges, posts } from '@/data/mockData';

const stats = [
  { label: 'Km Total', value: '28.4k', icon: Route },
  { label: 'Rolês', value: '142', icon: Flame },
  { label: 'Horas', value: '486', icon: Clock },
  { label: 'Badges', value: '7', icon: Award },
];

export const Profile = () => {
  const userPosts = posts.slice(0, 3);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/30">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="font-semibold text-lg">Perfil</h1>
          <motion.button whileTap={{ scale: 0.9 }}>
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
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-28 h-28 rounded-full border-4 border-background object-cover"
              />
              <button className="absolute bottom-1 right-1 p-2 bg-primary rounded-full">
                <Edit2 className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
            
            <div className="flex-1 pb-2">
              <h2 className="text-xl font-bold">{currentUser.name}</h2>
              <p className="text-sm text-muted-foreground">@{currentUser.username}</p>
            </div>
          </div>

          {/* Bike Info */}
          <div className="mt-4 p-4 bg-card rounded-xl border border-border/50">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🏍️</div>
              <div>
                <p className="font-semibold">{currentUser.bike}</p>
                <p className="text-sm text-muted-foreground">Minha companheira desde 2021</p>
              </div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="mt-4 p-4 bg-card rounded-xl border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Nível {currentUser.level}</span>
              <span className="text-xs text-primary font-medium">2.450 XP para Nível {currentUser.level + 1}</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '68%' }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-4 gap-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl p-3 text-center border border-border/50"
              >
                <Icon className="w-5 h-5 mx-auto text-primary mb-1" />
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </motion.div>
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
          <button className="text-sm text-primary font-medium">Ver todas</button>
        </div>
        
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`flex-shrink-0 p-3 rounded-xl border text-center min-w-[80px] ${
                badge.unlocked
                  ? 'bg-card border-primary/30'
                  : 'bg-secondary/50 border-border/30 opacity-50'
              }`}
            >
              <span className="text-2xl">{badge.icon}</span>
              <p className="text-[10px] font-medium mt-1 truncate">{badge.name}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Rides */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Route className="w-4 h-4 text-primary" />
            Últimos Rolês
          </h3>
          <button className="text-sm text-primary font-medium">Ver todos</button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {userPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="relative aspect-square rounded-xl overflow-hidden"
            >
              <img
                src={post.image}
                alt={post.location}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-[10px] text-white font-medium truncate">{post.distance} km</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
