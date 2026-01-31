import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useAuthEmailPassword() {
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Login realizado com sucesso',
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: 'Erro no login',
        description: error.message || 'Não foi possível fazer login',
        variant: 'destructive',
      });
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, username: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            username: username,
          },
        },
      });

      if (error) throw error;

      // O perfil é criado automaticamente pelo trigger handle_new_user
      // Mas vamos garantir que username seja único
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ username, name })
          .eq('id', data.user.id);

        if (profileError) {
          console.error('Erro ao atualizar perfil:', profileError);
        }
      }

      toast({
        title: 'Conta criada!',
        description: 'Bem-vindo ao RideConnect!',
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao criar conta',
        description: error.message || 'Não foi possível criar a conta',
        variant: 'destructive',
      });
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: 'Logout realizado',
        description: 'Você saiu da sua conta',
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível fazer logout',
        variant: 'destructive',
      });
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signIn,
    signUp,
    signOut,
    isLoading,
  };
}
