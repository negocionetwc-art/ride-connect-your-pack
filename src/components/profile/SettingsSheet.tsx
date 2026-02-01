import { useState, useEffect } from 'react';
import { LogOut, User, Image, Lock, Mail, ImageIcon } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuthEmailPassword } from '@/hooks/useAuthEmailPassword';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditProfile: () => void;
  onEditAvatar: () => void;
  onEditCover?: () => void;
}

export const SettingsSheet = ({
  open,
  onOpenChange,
  onEditProfile,
  onEditAvatar,
  onEditCover,
}: SettingsSheetProps) => {
  const { signOut } = useAuthEmailPassword();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Buscar email do usuário
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email || null);
    });
  }, []);

  const handleSignOut = async () => {
    await signOut();
    queryClient.clear();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Configurações</SheetTitle>
          <SheetDescription>
            Gerencie sua conta e preferências
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Conta */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Conta</h3>
            {userEmail && (
              <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border/50">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>
              </div>
            )}
          </div>

          {/* Perfil */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Perfil</h3>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                onEditProfile();
                onOpenChange(false);
              }}
            >
              <User className="w-4 h-4 mr-2" />
              Editar perfil
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                onEditAvatar();
                onOpenChange(false);
              }}
            >
              <Image className="w-4 h-4 mr-2" />
              Trocar avatar
            </Button>
            {onEditCover && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  onEditCover();
                  onOpenChange(false);
                }}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Trocar capa do perfil
              </Button>
            )}
          </div>

          {/* Segurança */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Segurança</h3>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                // TODO: Implementar alteração de senha
                alert('Funcionalidade em breve');
              }}
            >
              <Lock className="w-4 h-4 mr-2" />
              Alterar senha
            </Button>
          </div>

          {/* Sair */}
          <div className="pt-4 border-t border-border">
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair da conta
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
