import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Verificar usuário autenticado
    const checkUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (!currentUser) {
        console.log('⚠️ Nenhum usuário autenticado encontrado');
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      console.log('👤 Usuário autenticado encontrado:', {
        id: currentUser.id,
        email: currentUser.email,
      });

      // Verificar se o usuário tem role de admin
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id)
        .eq('role', 'admin')
        .single();

      console.log('🔍 Verificando role de admin:', {
        userId: currentUser.id,
        data,
        error: error?.code === 'PGRST116' ? 'Nenhuma role encontrada' : error,
      });

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Erro ao verificar role de admin:', error);
        setIsAdmin(false);
      } else {
        const hasAdminRole = !!data;
        console.log('✅ Resultado da verificação:', { hasAdminRole, role: data?.role });
        setIsAdmin(hasAdminRole);
      }

      setIsLoading(false);
    };

    checkUser();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkUser();
      } else {
        setUser(null);
        setIsAdmin(false);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { isAdmin, isLoading, user };
}
