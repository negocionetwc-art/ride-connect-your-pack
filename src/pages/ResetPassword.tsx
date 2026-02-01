import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Bike, Lock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { z } from 'zod';

const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');

export default function ResetPassword() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Verificar se temos uma sessão de recovery válida
    const checkRecoverySession = async () => {
      try {
        console.log('🔍 Verificando sessão de recovery...');
        
        // Verificar a URL por tokens de recovery
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
        const type = hashParams.get('type') || queryParams.get('type');
        const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
        
        console.log('📋 Parâmetros encontrados:', { 
          hasAccessToken: !!accessToken, 
          type, 
          hasRefreshToken: !!refreshToken 
        });

        // Se temos tokens na URL, definir a sessão
        if (accessToken && type === 'recovery') {
          console.log('🔐 Token de recovery encontrado, definindo sessão...');
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (error) {
            console.error('❌ Erro ao definir sessão:', error);
            toast.error('Link de recuperação inválido ou expirado.');
            setIsValidSession(false);
          } else {
            console.log('✅ Sessão de recovery válida');
            setIsValidSession(true);
          }
        } else {
          // Verificar se já existe uma sessão ativa de recovery
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (session?.user) {
            console.log('✅ Sessão existente encontrada');
            setIsValidSession(true);
          } else {
            console.log('❌ Nenhuma sessão de recovery válida');
            toast.error('Link de recuperação inválido ou expirado. Solicite um novo link.');
            setIsValidSession(false);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao verificar sessão:', error);
        setIsValidSession(false);
      } finally {
        setIsCheckingSession(false);
      }
    };

    // Escutar eventos de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth event:', event);
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log('✅ Evento PASSWORD_RECOVERY detectado');
        setIsValidSession(true);
        setIsCheckingSession(false);
      }
    });

    checkRecoverySession();

    return () => subscription.unsubscribe();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      console.log('🔐 Atualizando senha...');
      
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error('❌ Erro ao atualizar senha:', error);
        
        if (error.message.includes('same_password')) {
          toast.error('A nova senha deve ser diferente da senha atual.');
        } else if (error.message.includes('weak_password')) {
          toast.error('Senha muito fraca. Use uma senha mais forte.');
        } else {
          toast.error(error.message || 'Erro ao atualizar senha');
        }
        return;
      }

      console.log('✅ Senha atualizada com sucesso');
      setIsSuccess(true);
      toast.success('Senha atualizada com sucesso!');
      
      // Fazer logout para forçar novo login com a nova senha
      await supabase.auth.signOut();
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Erro inesperado:', error);
      toast.error(error.message || 'Erro ao atualizar senha');
    } finally {
      setIsLoading(false);
    }
  };

  // Tela de loading
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-30" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl opacity-30" />
        </div>
        
        <div className="relative z-10 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando link de recuperação...</p>
        </div>
      </div>
    );
  }

  // Tela de link inválido
  if (!isValidSession && !isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-30" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl opacity-30" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 mb-4">
              <Lock className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="font-display text-2xl tracking-wider mb-2">Link Inválido</h1>
            <p className="text-muted-foreground">
              O link de recuperação é inválido ou expirou.
            </p>
          </div>

          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Por favor, solicite um novo link de recuperação na página de login.
              </p>
              <Button
                onClick={() => navigate('/login')}
                className="w-full gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para o login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Tela de sucesso
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-30" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl opacity-30" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="font-display text-2xl tracking-wider mb-2">Senha Atualizada!</h1>
            <p className="text-muted-foreground">
              Sua senha foi alterada com sucesso.
            </p>
          </div>

          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Você será redirecionado para a página de login em instantes...
              </p>
              <Button
                onClick={() => navigate('/login')}
                className="w-full gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Ir para o login agora
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Formulário de nova senha
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4 glow">
            <Bike className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-4xl tracking-wider text-gradient">RIDECONNECT</h1>
          <p className="text-muted-foreground mt-2">Definir nova senha</p>
        </div>

        <Card className="glass border-border/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Nova Senha</CardTitle>
            <CardDescription>
              Digite sua nova senha abaixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  Nova senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  Confirmar senha
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={errors.confirmPassword ? 'border-destructive' : ''}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Atualizar senha'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para o login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
