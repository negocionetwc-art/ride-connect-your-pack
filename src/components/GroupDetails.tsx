import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  User,
  Settings,
  LogOut,
  Loader2,
  Crown,
  UserCog,
  Info,
  Image as ImageIcon,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { useJoinGroup, useLeaveGroup } from '@/hooks/useGroupMembership';
import type { GroupWithDetails } from '@/hooks/useGroups';
import type { Database } from '@/integrations/supabase/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Profile = Database['public']['Tables']['profiles']['Row'];
type GroupMembership = Database['public']['Tables']['group_memberships']['Row'];
type Post = Database['public']['Tables']['posts']['Row'];

interface GroupMember extends GroupMembership {
  profile: Profile;
}

interface GroupPost extends Post {
  profile: Profile;
}

interface GroupDetailsProps {
  group: GroupWithDetails;
  open: boolean;
  onClose: () => void;
}

export const GroupDetails = ({ group, open, onClose }: GroupDetailsProps) => {
  const [userRole, setUserRole] = useState<GroupMembership['role'] | null>(group.userRole || null);
  const [activeTab, setActiveTab] = useState('about');
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Se a lista (Groups) já trouxe isJoined/userRole, usamos isso; senão, inferimos via RPC.
  const initialIsJoined = !!group.isJoined;

  const { data: isGroupMember } = useQuery({
    queryKey: ['is-group-member', group.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_group_member', { _group_id: group.id });
      if (error) throw error;
      return !!data;
    },
    enabled: open && !initialIsJoined,
  });

  const { data: isGroupAdmin } = useQuery({
    queryKey: ['is-group-admin', group.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_group_admin', { _group_id: group.id });
      if (error) throw error;
      return !!data;
    },
    enabled: open && (initialIsJoined || !!isGroupMember),
  });

  const effectiveIsMember = initialIsJoined || !!isGroupMember;
  const effectiveIsAdmin = !!isGroupAdmin || userRole === 'admin';
  const effectiveCanManage = effectiveIsAdmin || userRole === 'moderator';

  // Se o usuário é membro, podemos buscar (via RLS) a role exata dele, para diferenciar moderator/member.
  const { data: myMembershipRole } = useQuery({
    queryKey: ['my-group-role', group.id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('group_memberships')
        .select('role')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return (data?.role ?? null) as GroupMembership['role'] | null;
    },
    enabled: open && effectiveIsMember,
  });

  useEffect(() => {
    // Prioridade: role vinda da listagem -> role da query -> admin via RPC
    if (group.userRole) {
      setUserRole(group.userRole);
      return;
    }
    if (myMembershipRole) {
      setUserRole(myMembershipRole);
      return;
    }
    if (effectiveIsAdmin) {
      setUserRole('admin');
      return;
    }
    if (effectiveIsMember && !userRole) {
      setUserRole('member');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id, group.userRole, myMembershipRole, effectiveIsAdmin, effectiveIsMember]);

  const { data: members, isLoading: isLoadingMembers, error: membersError } = useQuery({
    queryKey: ['group-members', group.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_memberships')
        .select(`
          *,
          profile:profiles!group_memberships_user_id_fkey(*)
        `)
        .eq('group_id', group.id)
        .order('joined_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []) as GroupMember[];
    },
    enabled: open && effectiveIsMember,
  });

  // Query para posts do grupo (posts de membros)
  const { data: groupPosts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ['group-posts', group.id],
    queryFn: async () => {
      // Primeiro, buscar IDs dos membros do grupo
      const { data: memberIds, error: memberError } = await supabase
        .from('group_memberships')
        .select('user_id')
        .eq('group_id', group.id);

      if (memberError) throw memberError;
      if (!memberIds || memberIds.length === 0) return [];

      const userIds = memberIds.map(m => m.user_id);

      // Buscar posts dos membros
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profile:profiles!posts_user_id_fkey(*)
        `)
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []) as GroupPost[];
    },
    enabled: open && effectiveIsMember && activeTab === 'posts',
  });

  // Query para estatísticas do grupo
  const { data: groupStats } = useQuery({
    queryKey: ['group-stats', group.id],
    queryFn: async () => {
      const { data: memberIds } = await supabase
        .from('group_memberships')
        .select('user_id')
        .eq('group_id', group.id);

      if (!memberIds || memberIds.length === 0) {
        return { totalPosts: 0, totalDistance: 0, recentActivity: null };
      }

      const userIds = memberIds.map(m => m.user_id);

      const { data: posts } = await supabase
        .from('posts')
        .select('distance_km, created_at')
        .in('user_id', userIds);

      const totalPosts = posts?.length || 0;
      const totalDistance = posts?.reduce((sum, p) => sum + (p.distance_km || 0), 0) || 0;
      const recentActivity = posts?.[0]?.created_at || null;

      return { totalPosts, totalDistance, recentActivity };
    },
    enabled: open && effectiveIsMember,
  });

  const handleJoin = async () => {
    await joinGroup.mutateAsync(group.id);
    setUserRole('member');
  };

  const handleLeave = async () => {
    await leaveGroup.mutateAsync(group.id);
    setUserRole(null);
  };

  const getRoleBadge = (role: GroupMembership['role']) => {
    switch (role) {
      case 'admin':
        return (
          <Badge variant="default" className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
            <Crown className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      case 'moderator':
        return (
          <Badge variant="default" className="bg-blue-500/20 text-blue-600 dark:text-blue-400">
            <UserCog className="w-3 h-3 mr-1" />
            Moderador
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <User className="w-3 h-3 mr-1" />
            Membro
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{group.name}</DialogTitle>
          <DialogDescription>{group.description || 'Sem descrição'}</DialogDescription>
        </DialogHeader>

        {/* Cover Image */}
        {group.cover_url && (
          <div className="relative w-full h-40 rounded-lg overflow-hidden -mx-6 -mt-2">
            <img
              src={group.cover_url}
              alt={group.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            {/* Stats overlay */}
            <div className="absolute bottom-3 left-4 right-4 flex items-center gap-4 text-white">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                <span className="font-semibold">{group.member_count}</span>
                <span className="text-white/80">membros</span>
              </div>
              {groupStats && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <ImageIcon className="w-4 h-4" />
                    <span className="font-semibold">{groupStats.totalPosts}</span>
                    <span className="text-white/80">posts</span>
                  </div>
                  {groupStats.totalDistance > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-semibold">{groupStats.totalDistance.toFixed(0)}km</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Category and Role Badge */}
        <div className="flex items-center gap-3 -mt-2">
          <Badge variant="outline" className="text-primary">
            {group.category}
          </Badge>
          {effectiveIsMember && userRole && (
            <div className="ml-auto">
              {getRoleBadge(userRole)}
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="about" className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              Sobre
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2" disabled={!effectiveIsMember}>
              <Users className="w-4 h-4" />
              Membros
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2" disabled={!effectiveIsMember}>
              <ImageIcon className="w-4 h-4" />
              Posts
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 pr-4 mt-4">
            <TabsContent value="about" className="mt-0 space-y-4">
              {/* Owner Info */}
              {group.owner && (
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <Avatar>
                    <AvatarImage src={group.owner.avatar_url || undefined} />
                    <AvatarFallback>
                      {group.owner.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Criado por</p>
                    <p className="text-xs text-muted-foreground">
                      {group.owner.name} (@{group.owner.username})
                    </p>
                  </div>
                  {group.owner.id === currentUser?.id && (
                    <Badge variant="default">
                      <Crown className="w-3 h-3 mr-1" />
                      Você
                    </Badge>
                  )}
                </div>
              )}

              {/* Description */}
              {group.description && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Descrição</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {group.description}
                  </p>
                </div>
              )}

              <Separator />

              {/* Group Stats */}
              {groupStats && effectiveIsMember && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary/30 rounded-lg space-y-1">
                    <div className="flex items-center gap-2 text-primary">
                      <ImageIcon className="w-4 h-4" />
                      <span className="text-xs font-medium">Total de Posts</span>
                    </div>
                    <p className="text-2xl font-bold">{groupStats.totalPosts}</p>
                  </div>
                  <div className="p-4 bg-secondary/30 rounded-lg space-y-1">
                    <div className="flex items-center gap-2 text-primary">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-medium">KM Percorridos</span>
                    </div>
                    <p className="text-2xl font-bold">{groupStats.totalDistance.toFixed(0)}</p>
                  </div>
                </div>
              )}

              {/* Created Date */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  Criado {formatDistanceToNow(new Date(group.created_at), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </span>
              </div>
            </TabsContent>

            <TabsContent value="members" className="mt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {members?.length || 0} {members?.length === 1 ? 'membro' : 'membros'}
                  </p>
                  {effectiveCanManage && (
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Gerenciar
                    </Button>
                  )}
                </div>

                {isLoadingMembers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : membersError ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Não foi possível carregar a lista de membros agora.
                  </p>
                ) : members && members.length > 0 ? (
                  <div className="space-y-2">
                    {members.map((member, index) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-all duration-200 hover:scale-[1.02]"
                        style={{
                          animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`
                        }}
                      >
                        <Avatar className="w-12 h-12 ring-2 ring-transparent hover:ring-primary/50 transition-all">
                          <AvatarImage src={member.profile.avatar_url || undefined} />
                          <AvatarFallback>
                            {member.profile.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {member.profile.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            @{member.profile.username}
                          </p>
                          {member.profile.bike && (
                            <p className="text-xs text-muted-foreground truncate">
                              {member.profile.bike}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getRoleBadge(member.role)}
                          {member.profile.id === currentUser?.id && (
                            <Badge variant="outline" className="ml-2">
                              Você
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum membro encontrado
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="posts" className="mt-0">
              {isLoadingPosts ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : groupPosts && groupPosts.length > 0 ? (
                <div className="space-y-4">
                  {groupPosts.map((post, index) => (
                    <div 
                      key={post.id} 
                      className="border rounded-lg overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
                      style={{
                        animation: `fadeInUp 0.4s ease-out ${index * 0.08}s both`
                      }}
                    >
                      {/* Post Image */}
                      {post.image_url && (
                        <div className="relative aspect-square w-full overflow-hidden">
                          <img
                            src={post.image_url}
                            alt={post.caption || 'Post'}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                        </div>
                      )}
                      
                      {/* Post Info */}
                      <div className="p-4 space-y-3">
                        {/* Author */}
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 ring-2 ring-transparent hover:ring-primary/50 transition-all">
                            <AvatarImage src={post.profile.avatar_url || undefined} />
                            <AvatarFallback>
                              {post.profile.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">
                              {post.profile.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(post.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Caption */}
                        {post.caption && (
                          <p className="text-sm leading-relaxed">{post.caption}</p>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {post.distance_km && (
                            <div className="flex items-center gap-1 hover:text-primary transition-colors">
                              <TrendingUp className="w-3 h-3" />
                              <span>{post.distance_km}km</span>
                            </div>
                          )}
                          {post.location && (
                            <span className="hover:text-primary transition-colors">
                              📍 {post.location}
                            </span>
                          )}
                          <div className="ml-auto flex items-center gap-3">
                            <span className="hover:text-red-500 transition-colors cursor-pointer">
                              ❤️ {post.likes_count}
                            </span>
                            <span className="hover:text-primary transition-colors cursor-pointer">
                              💬 {post.comments_count}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
                  <ImageIcon className="w-12 h-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum post ainda
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Os posts dos membros aparecerão aqui
                  </p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          {!effectiveIsMember ? (
            <Button
              onClick={handleJoin}
              disabled={joinGroup.isPending}
              className="flex-1"
            >
              {joinGroup.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Entrando...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Entrar no Grupo
                </>
              )}
            </Button>
          ) : (
            <>
              {effectiveCanManage && (
                <Button variant="outline" className="flex-1">
                  <Settings className="w-4 h-4 mr-2" />
                  Gerenciar Grupo
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={handleLeave}
                disabled={leaveGroup.isPending}
                className="flex-1"
              >
                {leaveGroup.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saindo...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair do Grupo
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
