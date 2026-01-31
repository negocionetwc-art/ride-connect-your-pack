import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Bike } from 'lucide-react';
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
  const { signIn, signUp, isLoading } = useAuthEmailPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      await signUp(email, password, name, username);
    } else {
      await signIn(email, password);
    }
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

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
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
