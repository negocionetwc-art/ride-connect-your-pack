import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Group = Database['public']['Tables']['groups']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type GroupMembership = Database['public']['Tables']['group_memberships']['Row'];

export interface GroupWithDetails extends Group {
  owner?: Profile;
  isJoined?: boolean;
  userRole?: GroupMembership['role'];
}

export function useGroups(category?: string, searchQuery?: string) {
  return useQuery({
    queryKey: ['groups', category, searchQuery],
    queryFn: async () => {
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar grupos
      let query = supabase
        .from('groups')
        .select(`
          *,
          owner:profiles!groups_owner_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtro de categoria
      if (category && category !== 'Todos') {
        query = query.eq('category', category);
      }

      // Aplicar busca
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data: groups, error: groupsError } = await query;

      if (groupsError) {
        throw groupsError;
      }

      // Buscar memberships do usuário atual
      const { data: memberships, error: membershipsError } = await supabase
        .from('group_memberships')
        .select('group_id, role')
        .eq('user_id', user.id);

      if (membershipsError) {
        throw membershipsError;
      }

      // Criar mapa de memberships para lookup rápido
      const membershipMap = new Map(
        memberships?.map(m => [m.group_id, m.role]) || []
      );

      // Combinar dados
      const groupsWithDetails: GroupWithDetails[] = (groups || []).map(group => ({
        ...group,
        owner: group.owner as Profile,
        isJoined: membershipMap.has(group.id),
        userRole: membershipMap.get(group.id),
      }));

      return groupsWithDetails;
    },
  });
}

export function useUserGroups() {
  return useQuery({
    queryKey: ['user-groups'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('group_memberships')
        .select(`
          group_id,
          role,
          group:groups!group_memberships_group_id_fkey(
            *,
            owner:profiles!groups_owner_id_fkey(*)
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      return (data || []).map(item => ({
        ...item.group,
        owner: item.group.owner as Profile,
        userRole: item.role,
        isJoined: true,
      })) as GroupWithDetails[];
    },
  });
}
