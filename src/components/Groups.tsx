import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Plus, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { useGroups, useUserGroups } from '@/hooks/useGroups';
import { useJoinGroup, useLeaveGroup } from '@/hooks/useGroupMembership';
import { CreateGroup } from './CreateGroup';
import { GroupDetails } from './GroupDetails';
import type { GroupWithDetails } from '@/hooks/useGroups';

const categories = ['Todos', 'Marca', 'Região', 'Estilo'];

export const Groups = () => {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithDetails | null>(null);
  const [pendingGroupId, setPendingGroupId] = useState<string | null>(null);

  const categoryFilter = activeCategory === 'Todos' ? undefined : activeCategory;
  const { data: allGroups, isLoading: isLoadingGroups, error: groupsError, refetch: refetchGroups } = useGroups(categoryFilter, searchQuery);
  const { data: userGroups, isLoading: isLoadingUserGroups, refetch: refetchUserGroups } = useUserGroups();
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();

  const handleJoinLeave = async (group: GroupWithDetails) => {
    try {
      setPendingGroupId(group.id);
      if (group.isJoined) {
        await leaveGroup.mutateAsync(group.id);
      } else {
        await joinGroup.mutateAsync(group.id);
      }
    } finally {
      setPendingGroupId(null);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/30">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="font-semibold text-lg">Grupos</h1>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowCreateGroup(true)}
            className="p-2 rounded-full bg-primary"
          >
            <Plus className="w-5 h-5 text-primary-foreground" />
          </motion.button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar grupos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-secondary rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* My Groups Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Meus Grupos
            </h2>
          </div>

          {isLoadingUserGroups ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : userGroups && userGroups.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {userGroups.map((group, index) => (
                <motion.button
                  key={group.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedGroup(group)}
                  className="flex-shrink-0 w-32"
                >
                  <div className="relative aspect-[3/2] rounded-xl overflow-hidden mb-2">
                    <img
                      src={group.cover_url || '/placeholder.svg'}
                      alt={group.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-xs font-medium text-white truncate">{group.name}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Você ainda não entrou em nenhum grupo
            </div>
          )}
        </div>

        {/* Discover Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Descobrir
            </h2>
          </div>

          {isLoadingGroups ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-card rounded-xl border border-border/50 animate-pulse">
                  <div className="w-16 h-16 rounded-xl bg-secondary" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-secondary rounded w-3/4" />
                    <div className="h-3 bg-secondary rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : groupsError ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="w-8 h-8 text-destructive mb-2" />
              <p className="text-sm text-muted-foreground">
                {(groupsError as Error)?.message === 'Usuário não autenticado'
                  ? 'Faça login para ver e participar de grupos.'
                  : 'Erro ao carregar grupos. Tente novamente.'}
              </p>
              {(groupsError as Error)?.message !== 'Usuário não autenticado' && (
                <button
                  onClick={() => {
                    refetchGroups();
                    refetchUserGroups();
                  }}
                  className="mt-3 text-sm text-primary font-medium"
                >
                  Tentar novamente
                </button>
              )}
            </div>
          ) : allGroups && allGroups.length > 0 ? (
            <div className="space-y-3">
              {allGroups.map((group, index) => {
                const isProcessing = pendingGroupId === group.id;
                return (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-3 bg-card rounded-xl border border-border/50"
                  >
                    <button
                      onClick={() => setSelectedGroup(group)}
                      className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"
                    >
                      <img
                        src={group.cover_url || '/placeholder.svg'}
                        alt={group.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                    
                    <button
                      onClick={() => setSelectedGroup(group)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <h3 className="font-semibold truncate">{group.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{group.description || 'Sem descrição'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {group.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {group.member_count.toLocaleString()} membros
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleJoinLeave(group)}
                      disabled={isProcessing}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${
                        group.isJoined
                          ? 'bg-secondary text-foreground'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : group.isJoined ? (
                        'Entrou'
                      ) : (
                        'Entrar'
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum grupo encontrado
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateGroup
          open={showCreateGroup}
          onClose={() => setShowCreateGroup(false)}
        />
      )}

      {/* Group Details Modal */}
      {selectedGroup && (
        <GroupDetails
          group={selectedGroup}
          open={!!selectedGroup}
          onClose={() => setSelectedGroup(null)}
        />
      )}
    </div>
  );
};
