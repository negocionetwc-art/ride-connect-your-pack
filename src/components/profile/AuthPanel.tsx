import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User } from 'lucide-react';
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
  const { signIn, signUp, resendConfirmationEmail, isLoading } = useAuthEmailPassword();

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
                <Input
                  id="username"
                  type="text"
                  placeholder="joao_rider"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  pattern="[a-z0-9_]+"
                  title="Apenas letras minúsculas, números e underscore"
                />
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
            disabled={isLoading}
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
