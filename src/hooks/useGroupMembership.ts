import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('group_memberships')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member',
        });

      if (error) {
        throw error;
      }
    },
    onSuccess: (_data, groupId) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      queryClient.invalidateQueries({ queryKey: ['is-group-member', groupId] });
      queryClient.invalidateQueries({ queryKey: ['is-group-admin', groupId] });
      queryClient.invalidateQueries({ queryKey: ['my-group-role', groupId] });
      toast({
        title: 'Sucesso!',
        description: 'Você entrou no grupo',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível entrar no grupo',
        variant: 'destructive',
      });
    },
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('group_memberships')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }
    },
    onSuccess: (_data, groupId) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      queryClient.invalidateQueries({ queryKey: ['is-group-member', groupId] });
      queryClient.invalidateQueries({ queryKey: ['is-group-admin', groupId] });
      queryClient.invalidateQueries({ queryKey: ['my-group-role', groupId] });
      toast({
        title: 'Sucesso!',
        description: 'Você saiu do grupo',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível sair do grupo',
        variant: 'destructive',
      });
    },
  });
}
