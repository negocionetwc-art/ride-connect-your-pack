import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface AuthBannerProps {
  onClose?: () => void;
}

export const AuthBanner = ({ onClose }: AuthBannerProps) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // Verificar se já foi fechado anteriormente (apenas sessão atual)
  useEffect(() => {
    const dismissed = sessionStorage.getItem('auth-banner-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('auth-banner-dismissed', 'true');
    setIsDismissed(true);
    onClose?.();
  };

  const handleCreateAccount = () => {
    navigate('/auth?mode=signup');
  };

  const handleLogin = () => {
    navigate('/auth?mode=login');
  };

  if (isDismissed || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-20 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl shadow-lg p-4 relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-orange-500/5 pointer-events-none" />
          
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-secondary/80 transition-colors z-10"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🏍️</span>
              <h3 className="font-display text-lg font-bold text-gradient">
                RideConnect
              </h3>
            </div>

            {/* Message */}
            <p className="text-sm text-muted-foreground mb-4 pr-6">
              Crie uma conta para interagir, postar e participar da comunidade de motociclistas!
            </p>

            {/* Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleCreateAccount}
                className="flex-1"
                size="sm"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Criar conta
              </Button>
              <Button
                onClick={handleLogin}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Entrar
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
