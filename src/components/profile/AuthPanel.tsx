import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useAuthEmailPassword } from '@/hooks/useAuthEmailPassword';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const AuthPanel = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [showResendEmail, setShowResendEmail] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const { signIn, signUp, resendConfirmationEmail, checkUsernameAvailable, isLoading } = useAuthEmailPassword();
  const usernameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      const result = await signUp(email, password, name, username);
      // Se o cadastro foi bem-sucedido mas não há sessão, significa que precisa confirmar email
      if (result?.data?.user && !result?.data?.session) {
        setShowResendEmail(true);
      }
    } else {
      const result = await signIn(email, password);
      // Se o login falhou por email não confirmado, mostrar opção de reenviar
      if (result?.error?.message?.includes('Email not confirmed') || 
          result?.error?.message?.includes('email not confirmed')) {
        setShowResendEmail(true);
      }
    }
  };

  const handleResendEmail = async () => {
    if (!email) return;
    await resendConfirmationEmail(email);
  };

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
      return;
    }
    
    // Validar formato básico
    if (!/^[a-z0-9_]+$/.test(normalizedValue)) {
      setUsernameStatus('idle');
      return;
    }
    
    // Debounce: aguardar 500ms antes de verificar
    setUsernameStatus('checking');
    usernameCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const isAvailable = await checkUsernameAvailable(normalizedValue);
        setUsernameStatus(isAvailable ? 'available' : 'taken');
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
    if (!isSignUp) {
      setUsernameStatus('idle');
      setUsername('');
    }
  }, [isSignUp]);

  return (
    <div className="min-h-screen pb-20 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border/50 rounded-2xl p-6 space-y-6"
      >
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">RideConnect</h1>
          <p className="text-sm text-muted-foreground">
            {isSignUp ? 'Crie sua conta para começar' : 'Entre na sua conta'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nome completo
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="João Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  @username
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="joao_rider"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    required
                    pattern="[a-z0-9_]+"
                    title="Apenas letras minúsculas, números e underscore"
                    className={
                      usernameStatus === 'taken'
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
                {username.length > 0 && username.length < 3 && (
                  <p className="text-xs text-muted-foreground">Mínimo de 3 caracteres</p>
                )}
                {username.length > 0 && !/^[a-z0-9_]+$/.test(username) && (
                  <p className="text-xs text-destructive">Apenas letras minúsculas, números e _</p>
                )}
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || (isSignUp && (usernameStatus === 'taken' || usernameStatus === 'checking' || username.length < 3))}
          >
            {isLoading ? 'Carregando...' : isSignUp ? 'Criar conta' : 'Entrar'}
          </Button>
        </form>

        {showResendEmail && (
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
            <p className="text-sm text-muted-foreground mb-2">
              Não recebeu o email de confirmação?
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResendEmail}
              disabled={isLoading}
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" />
              Reenviar email de confirmação
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              ⚠️ Se aparecer erro de "rate limit", aguarde 1h ou desabilite confirmação de email no Dashboard
            </p>
          </div>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setShowResendEmail(false);
            }}
            className="text-sm text-primary hover:underline"
          >
            {isSignUp
              ? 'Já tem uma conta? Entrar'
              : 'Não tem uma conta? Criar conta'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
