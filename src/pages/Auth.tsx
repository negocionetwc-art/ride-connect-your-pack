import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Bike, Mail, Lock, User, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { z } from 'zod';
import { useAuthEmailPassword } from '@/hooks/useAuthEmailPassword';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');
const nameSchema = z.string().min(2, 'Nome deve ter pelo menos 2 caracteres');
const usernameSchema = z.string().min(3, 'Username deve ter pelo menos 3 caracteres').regex(/^[a-zA-Z0-9_]+$/, 'Username pode conter apenas letras, números e _');

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
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
    
    // Limpar timeout anterior
    if (usernameCheckTimeoutRef.current) {
      clearTimeout(usernameCheckTimeoutRef.current);
    }
    
    // Resetar status se muito curto
    if (normalizedValue.length < 3) {
      setUsernameStatus('idle');
      // Limpar erro de username se existir
      if (errors.username) {
        const newErrors = { ...errors };
        delete newErrors.username;
        setErrors(newErrors);
      }
      return;
    }
    
    // Validar formato básico
    if (!/^[a-z0-9_]+$/.test(normalizedValue)) {
      setUsernameStatus('idle');
      setErrors({ ...errors, username: 'Apenas letras minúsculas, números e _' });
      return;
    }
    
    // Debounce: aguardar 500ms antes de verificar
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

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
    };
  }, []);

  // Resetar status do username ao alternar entre login/cadastro
  useEffect(() => {
    if (isLogin) {
      setUsernameStatus('idle');
      setUsername('');
    }
  }, [isLogin]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (!isLogin) {
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

    // Verificar username antes de prosseguir
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

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Background effects */}
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
          <p className="text-muted-foreground mt-2">Conectando motociclistas</p>
        </div>

        <Card className="glass border-border/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">
              {isLogin ? 'Entrar na sua conta' : 'Criar nova conta'}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? 'Use seu email e senha para acessar'
                : 'Preencha os dados para se cadastrar'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4">
              {!isLogin && (
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
                            ? 'border-green-500 pr-10'
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
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
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
                      <p className="text-xs text-green-600">✓ Username disponível</p>
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

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={isLoading || (!isLogin && (usernameStatus === 'taken' || usernameStatus === 'checking' || username.length < 3))}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Entrar' : 'Criar conta'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin ? (
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
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade.
        </p>
      </div>
    </div>
  );
}
