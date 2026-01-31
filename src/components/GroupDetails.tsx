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
import {
  Users,
  User,
  Settings,
  LogOut,
  Loader2,
  Crown,
  UserCog,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { useJoinGroup, useLeaveGroup } from '@/hooks/useGroupMembership';
import type { GroupWithDetails } from '@/hooks/useGroups';
import type { Database } from '@/integrations/supabase/types';
import { LocationRegistrationForm } from './LocationRegistrationForm';
import { AnimatePresence } from 'framer-motion';

type Profile = Database['public']['Tables']['profiles']['Row'];
type GroupMembership = Database['public']['Tables']['group_memberships']['Row'];

interface GroupMember extends GroupMembership {
  profile: Profile;
}

interface GroupDetailsProps {
  group: GroupWithDetails;
  open: boolean;
  onClose: () => void;
}

export const GroupDetails = ({ group, open, onClose }: GroupDetailsProps) => {
  const [userRole, setUserRole] = useState<GroupMembership['role'] | null>(group.userRole || null);
  const [showLocationForm, setShowLocationForm] = useState(false);
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{group.name}</DialogTitle>
          <DialogDescription>{group.description || 'Sem descrição'}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Cover Image */}
            {group.cover_url && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden -mx-6 -mt-4">
                <img
                  src={group.cover_url}
                  alt={group.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            )}

            {/* Group Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-primary">
                  {group.category}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{group.member_count} membros</span>
                </div>
                {effectiveIsMember && userRole && (
                  <div className="ml-auto">
                    {getRoleBadge(userRole)}
                  </div>
                )}
              </div>

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

              {/* Location Info */}
              {effectiveIsMember && (group.latitude && group.longitude) && (
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Localização Cadastrada</p>
                    {group.address && (
                      <p className="text-xs text-muted-foreground truncate">
                        {group.address}
                      </p>
                    )}
                    {group.is_visible_on_map && (
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-muted-foreground">
                          Visível no mapa
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              {/* Members List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Membros
                  </h3>
                  {effectiveCanManage && (
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Gerenciar
                    </Button>
                  )}
                </div>

                {!effectiveIsMember ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Entre no grupo para ver a lista de membros
                  </p>
                ) : isLoadingMembers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : membersError ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Não foi possível carregar a lista de membros agora.
                  </p>
                ) : members && members.length > 0 ? (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <Avatar className="w-10 h-10">
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
                        </div>
                        {getRoleBadge(member.role)}
                        {member.profile.id === currentUser?.id && (
                          <Badge variant="outline" className="ml-2">
                            Você
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum membro encontrado
                  </p>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

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
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowLocationForm(true)}
                    className="flex-1"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {group.latitude && group.longitude ? 'Editar Localização' : 'Cadastrar Localização'}
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Settings className="w-4 h-4 mr-2" />
                    Gerenciar Grupo
                  </Button>
                </>
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

      {/* Location Registration Form */}
      <AnimatePresence>
        {showLocationForm && (
          <LocationRegistrationForm
            group={group}
            onClose={() => setShowLocationForm(false)}
            onSuccess={() => {
              setShowLocationForm(false);
              // Recarregar dados do grupo se necessário
              window.location.reload();
            }}
          />
        )}
      </AnimatePresence>
    </Dialog>
  );
};
