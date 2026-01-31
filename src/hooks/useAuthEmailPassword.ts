import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useAuthEmailPassword() {
  const [isLoading, setIsLoading] = useState(false);

  const checkUsernameAvailable = async (username: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase().trim())
        .maybeSingle();
      
      // Se não encontrou nenhum resultado (error.code === 'PGRST116'), username está disponível
      // Se encontrou algum resultado, username já está em uso
      return !data; // true se disponível (não encontrou)
    } catch (error: any) {
      console.error('Erro ao verificar username:', error);
      // Em caso de erro, assumir que está disponível para não bloquear o cadastro
      return true;
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Aguardar um pouco para garantir que a sessão foi estabelecida
      await new Promise(resolve => setTimeout(resolve, 100));

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
      // 1. Validar username ANTES de criar usuário
      const normalizedUsername = username.toLowerCase().trim();
      
      if (normalizedUsername.length < 3) {
        throw new Error('Username deve ter pelo menos 3 caracteres');
      }

      console.log('🔍 Verificando disponibilidade do username:', normalizedUsername);
      const isAvailable = await checkUsernameAvailable(normalizedUsername);
      
      if (!isAvailable) {
        throw new Error(`Username "${normalizedUsername}" já está em uso. Escolha outro.`);
      }

      console.log('✅ Username disponível, prosseguindo com cadastro');

      // 2. URL de redirecionamento após confirmação de email
      const redirectUrl = `${window.location.origin}/`;

      console.log('📧 Iniciando cadastro para:', email);
      console.log('🔗 URL de redirecionamento:', redirectUrl);

      // 3. Criar usuário no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: name,
            username: normalizedUsername,
          },
        },
      });

      if (error) {
        console.error('❌ Erro no signUp:', error);
        
        // Tratamento específico para erros conhecidos
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          throw new Error('Este email já está cadastrado');
        }
        
        // Tratar erros de constraint do banco (username duplicado mesmo após validação)
        if (error.message.includes('unique') || error.message.includes('duplicate') || error.message.includes('Database error')) {
          throw new Error(`Username "${normalizedUsername}" já está em uso. Escolha outro.`);
        }
        
        throw error;
      }

      console.log('✅ SignUp realizado com sucesso');
      console.log('👤 Usuário criado:', data.user?.id);
      console.log('📧 Email confirmado?', data.user?.email_confirmed_at ? 'Sim' : 'Não');
      console.log('🔐 Sessão criada?', data.session ? 'Sim' : 'Não');

      // 4. Verificar se o perfil foi criado corretamente pelo trigger
      if (data.user) {
        // Aguardar um pouco para o trigger processar
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verificar se o perfil foi criado
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, name')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('⚠️ Erro ao verificar perfil criado:', profileError);
        } else {
          console.log('✅ Perfil criado com sucesso:', profile);
        }
      }

      // 5. Verificar se o email precisa ser confirmado
      if (data.user && !data.session) {
        // Email de confirmação foi enviado (ou deveria ser)
        console.log('📧 Email de confirmação DEVERIA ter sido enviado');
        console.log('⚠️ Se o email não chegou, verifique:');
        console.log('   1. Configurações no Supabase Dashboard (Authentication > Settings)');
        console.log('   2. Pasta de spam');
        console.log('   3. Se "Enable email confirmations" está habilitado');
        
        toast({
          title: 'Conta criada!',
          description: 'Verifique seu email para confirmar. Pode estar na pasta de spam.',
          duration: 10000,
        });
      } else if (data.session) {
        // Usuário foi autenticado automaticamente (confirmação de email desabilitada)
        console.log('✅ Usuário autenticado automaticamente (confirmação de email desabilitada)');
        toast({
          title: 'Conta criada!',
          description: 'Bem-vindo ao RideConnect!',
        });
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('❌ Erro completo no signUp:', error);
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

  const resendConfirmationEmail = async (email: string) => {
    setIsLoading(true);
    try {
      // Usar signUp novamente com o mesmo email para reenviar confirmação
      // O Supabase detecta que o email já existe e reenvia o email de confirmação
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: false, // Não criar novo usuário, apenas reenviar
        },
      });

      // Se signInWithOtp não funcionar, tentar método alternativo
      if (error) {
        // Método alternativo: fazer signUp novamente (Supabase detecta email existente)
        const { error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: 'temp_password_123', // Senha temporária, não será usada
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (signUpError) {
          // Tratar erro de rate limit especificamente
          if (signUpError.message.includes('rate limit') || 
              signUpError.message.includes('rate_limit') ||
              signUpError.message.includes('email rate limit')) {
            throw new Error(
              'Limite de emails excedido. Aguarde 1 hora ou desabilite confirmação de email no Dashboard para desenvolvimento.'
            );
          }
          throw signUpError;
        }
      }

      toast({
        title: 'Email reenviado!',
        description: 'Verifique sua caixa de entrada (e pasta de spam) para o link de confirmação.',
      });

      return { error: null };
    } catch (error: any) {
      console.error('Erro ao reenviar email:', error);
      toast({
        title: 'Erro ao reenviar email',
        description: error.message || 'Não foi possível reenviar o email de confirmação',
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
    resendConfirmationEmail,
    checkUsernameAvailable,
    isLoading,
  };
}
