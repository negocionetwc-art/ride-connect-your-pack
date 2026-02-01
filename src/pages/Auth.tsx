import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Bike, Mail, Lock, User, ArrowRight, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { useAuthEmailPassword } from '@/hooks/useAuthEmailPassword';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');
const nameSchema = z.string().min(2, 'Nome deve ter pelo menos 2 caracteres');
const usernameSchema = z.string().min(3, 'Username deve ter pelo menos 3 caracteres').regex(/^[a-zA-Z0-9_]+$/, 'Username pode conter apenas letras, números e _');

type AuthMode = 'login' | 'signup' | 'forgot-password';

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const { checkUsernameAvailable } = useAuthEmailPassword();
  const usernameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          navigate('/');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleUsernameChange = async (value: string) => {
    const normalizedValue = value.toLowerCase().trim();
    setUsername(normalizedValue);
    
    if (usernameCheckTimeoutRef.current) {
      clearTimeout(usernameCheckTimeoutRef.current);
    }
    
    if (normalizedValue.length < 3) {
      setUsernameStatus('idle');
      if (errors.username) {
        const newErrors = { ...errors };
        delete newErrors.username;
        setErrors(newErrors);
      }
      return;
    }
    
    if (!/^[a-z0-9_]+$/.test(normalizedValue)) {
      setUsernameStatus('idle');
      setErrors({ ...errors, username: 'Apenas letras minúsculas, números e _' });
      return;
    }
    
    setUsernameStatus('checking');
    usernameCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const isAvailable = await checkUsernameAvailable(normalizedValue);
        setUsernameStatus(isAvailable ? 'available' : 'taken');
        if (isAvailable) {
          const newErrors = { ...errors };
          delete newErrors.username;
          setErrors(newErrors);
        } else {
          setErrors({ ...errors, username: 'Este username já está em uso' });
        }
      } catch (error) {
        console.error('Erro ao verificar username:', error);
        setUsernameStatus('idle');
      }
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (mode === 'login') {
      setUsernameStatus('idle');
      setUsername('');
    }
    if (mode !== 'forgot-password') {
      setForgotPasswordSent(false);
    }
  }, [mode]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    if (mode !== 'forgot-password') {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }

    if (mode === 'signup') {
      const nameResult = nameSchema.safeParse(name);
      if (!nameResult.success) {
        newErrors.name = nameResult.error.errors[0].message;
      }

      const usernameResult = usernameSchema.safeParse(username);
      if (!usernameResult.success) {
        newErrors.username = usernameResult.error.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let errorMessage = 'Não foi possível fazer login';
        
        if (error.message.includes('Invalid login credentials') || 
            error.message.includes('invalid_credentials') ||
            error.message.includes('Email or password is incorrect')) {
          errorMessage = 'Email ou senha incorretos. Verifique suas credenciais ou crie uma conta.';
        } else if (error.message.includes('Email not confirmed') || 
                   error.message.includes('email_not_confirmed')) {
          errorMessage = 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.';
        } else if (error.message.includes('User not found') || 
                   error.message.includes('user_not_found')) {
          errorMessage = 'Usuário não encontrado. Verifique se o email está correto ou crie uma conta.';
        } else {
          errorMessage = error.message;
        }
        
        toast.error(errorMessage);
        return;
      }

      toast.success('Login realizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (usernameStatus === 'taken' || usernameStatus === 'checking') {
      toast.error('Por favor, escolha um username disponível');
      return;
    }

    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: name,
            username: username.toLowerCase().trim(),
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          toast.error('Este email já está cadastrado');
        } else if (error.message.includes('unique') || error.message.includes('duplicate') || error.message.includes('Database error')) {
          toast.error(`Username "${username}" já está em uso. Escolha outro.`);
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success('Cadastro realizado! Verifique seu email para confirmar. Pode estar na pasta de spam.');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setErrors({ email: emailResult.error.errors[0].message });
      return;
    }

    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      console.log('📧 Enviando email de recuperação para:', email);
      console.log('🔗 URL de redirecionamento:', redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error('❌ Erro ao enviar email:', error);
        
        if (error.message.includes('rate limit') || error.message.includes('rate_limit')) {
          toast.error('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
        } else {
          toast.error(error.message || 'Erro ao enviar email de recuperação');
        }
        return;
      }

      console.log('✅ Email de recuperação enviado');
      setForgotPasswordSent(true);
      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada (e pasta de spam).');
      
    } catch (error: any) {
      console.error('❌ Erro inesperado:', error);
      toast.error(error.message || 'Erro ao enviar email de recuperação');
    } finally {
      setIsLoading(false);
    }
  };

  const getFormTitle = () => {
    switch (mode) {
      case 'login': return 'Entrar na sua conta';
      case 'signup': return 'Criar nova conta';
      case 'forgot-password': return 'Recuperar senha';
    }
  };

  const getFormDescription = () => {
    switch (mode) {
      case 'login': return 'Use seu email e senha para acessar';
      case 'signup': return 'Preencha os dados para se cadastrar';
      case 'forgot-password': return 'Digite seu email para receber o link de recuperação';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4 glow">
            <Bike className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-4xl tracking-wider text-gradient">RIDECONNECT</h1>
          <p className="text-muted-foreground mt-2">Conectando motociclistas</p>
        </div>

        <Card className="glass border-border/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">
              {getFormTitle()}
            </CardTitle>
            <CardDescription>
              {getFormDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === 'forgot-password' && forgotPasswordSent ? (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Email enviado!</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Enviamos um link de recuperação para <strong>{email}</strong>. 
                    Verifique sua caixa de entrada e pasta de spam.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setMode('login');
                    setForgotPasswordSent(false);
                  }}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para o login
                </Button>
              </div>
            ) : (
              <>
                <form onSubmit={
                  mode === 'login' ? handleLogin : 
                  mode === 'signup' ? handleSignUp : 
                  handleForgotPassword
                } className="space-y-4">
                  {mode === 'signup' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          Nome completo
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Seu nome"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={errors.name ? 'border-destructive' : ''}
                        />
                        {errors.name && (
                          <p className="text-xs text-destructive">{errors.name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="username" className="flex items-center gap-2">
                          <span className="text-muted-foreground">@</span>
                          Username
                        </Label>
                        <div className="relative">
                          <Input
                            id="username"
                            type="text"
                            placeholder="seu_username"
                            value={username}
                            onChange={(e) => handleUsernameChange(e.target.value)}
                            className={
                              errors.username || usernameStatus === 'taken'
                                ? 'border-destructive pr-10'
                                : usernameStatus === 'available'
                                ? 'border-primary pr-10'
                                : usernameStatus === 'checking'
                                ? 'pr-10'
                                : ''
                            }
                          />
                          {usernameStatus === 'checking' && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            </div>
                          )}
                          {usernameStatus === 'available' && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                            </div>
                          )}
                          {usernameStatus === 'taken' && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <XCircle className="w-4 h-4 text-destructive" />
                            </div>
                          )}
                        </div>
                        {usernameStatus === 'checking' && (
                          <p className="text-xs text-muted-foreground">Verificando disponibilidade...</p>
                        )}
                        {usernameStatus === 'available' && (
                          <p className="text-xs text-primary">✓ Username disponível</p>
                        )}
                        {usernameStatus === 'taken' && (
                          <p className="text-xs text-destructive">✗ Este username já está em uso</p>
                        )}
                        {errors.username && (
                          <p className="text-xs text-destructive">{errors.username}</p>
                        )}
                        {username.length > 0 && username.length < 3 && !errors.username && (
                          <p className="text-xs text-muted-foreground">Mínimo de 3 caracteres</p>
                        )}
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email}</p>
                    )}
                  </div>

                  {mode !== 'forgot-password' && (
                    <div className="space-y-2">
                      <Label htmlFor="password" className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        Senha
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
                  )}

                  {mode === 'login' && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setMode('forgot-password')}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        Esqueceu sua senha?
                      </button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={isLoading || (mode === 'signup' && (usernameStatus === 'taken' || usernameStatus === 'checking' || username.length < 3))}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {mode === 'login' && 'Entrar'}
                        {mode === 'signup' && 'Criar conta'}
                        {mode === 'forgot-password' && 'Enviar link de recuperação'}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center space-y-2">
                  {mode === 'forgot-password' ? (
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 mx-auto"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Voltar para o login
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setMode(mode === 'login' ? 'signup' : 'login');
                        setErrors({});
                      }}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {mode === 'login' ? (
                        <>
                          Não tem conta?{' '}
                          <span className="text-primary font-medium">Cadastre-se</span>
                        </>
                      ) : (
                        <>
                          Já tem conta?{' '}
                          <span className="text-primary font-medium">Fazer login</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade.
        </p>
      </div>
    </div>
  );
}